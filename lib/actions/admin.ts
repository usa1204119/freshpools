"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma, isDbConfigured } from "@/lib/db";
import { refundPayment, razorpayConfigured } from "@/lib/razorpay";
import { scoreSchema, zodToFieldErrors, type ActionState } from "@/lib/validations";
import type { CollegeStatus, RequirementStatus } from "@prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session.user;
}

/* ── Check-in ────────────────────────────────────────────────────────────── */

export async function toggleCheckIn(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isDbConfigured) {
    return { status: "error", message: "This needs a database connection." };
  }
  const admin = await requireAdmin();
  if (!admin) return { status: "error", message: "Admins only." };

  const registrationId = String(formData.get("registrationId") ?? "");
  if (!registrationId) return { status: "error", message: "Missing registration." };

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    select: { id: true, checkedIn: true, eventId: true },
  });
  if (!registration) return { status: "error", message: "Registration not found." };

  const next = !registration.checkedIn;

  await prisma.registration.update({
    where: { id: registration.id },
    data: { checkedIn: next, checkedInAt: next ? new Date() : null },
  });

  revalidatePath(`/admin/events/${registration.eventId}/registrations`);
  return {
    status: "success",
    message: next ? "Checked in." : "Check-in removed.",
  };
}

/* ── Deposit refunds ─────────────────────────────────────────────────────── */

/**
 * NON-NEGOTIABLE #6: refunds are never automatic. An admin verifies check-in,
 * then runs this. Each refund is issued individually so one failure does not
 * abort the rest, and the final PROCESSED state still comes from the webhook.
 */
export async function refundCheckedInDeposits(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isDbConfigured) {
    return { status: "error", message: "This needs a database connection." };
  }
  if (!razorpayConfigured) {
    return { status: "error", message: "Razorpay is not configured." };
  }
  const admin = await requireAdmin();
  if (!admin) return { status: "error", message: "Admins only." };

  const eventId = String(formData.get("eventId") ?? "");
  if (!eventId) return { status: "error", message: "Missing event." };

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, depositAmount: true, title: true },
  });
  if (!event) return { status: "error", message: "Event not found." };
  if (event.depositAmount <= 0) {
    return { status: "error", message: "This event has no refundable deposit." };
  }

  const eligible = await prisma.registration.findMany({
    where: {
      eventId,
      checkedIn: true,
      paymentStatus: "PAID",
      razorpayPaymentId: { not: null },
      refundStatus: { in: ["NOT_DUE", "DUE", "FAILED"] },
    },
    select: { id: true, razorpayPaymentId: true },
  });

  if (eligible.length === 0) {
    return {
      status: "error",
      message: "Nobody is eligible — check people in first.",
    };
  }

  let issued = 0;
  let failed = 0;

  for (const registration of eligible) {
    try {
      const refund = await refundPayment({
        paymentId: registration.razorpayPaymentId!,
        amount: event.depositAmount,
        notes: { registrationId: registration.id, eventId },
      });

      await prisma.registration.update({
        where: { id: registration.id },
        data: {
          refundStatus: "DUE",
          refundId: refund.id,
          refundAmount: event.depositAmount,
        },
      });
      issued += 1;
    } catch (error) {
      console.error(`[refund] failed for registration ${registration.id}`, error);
      await prisma.registration.update({
        where: { id: registration.id },
        data: { refundStatus: "FAILED" },
      });
      failed += 1;
    }
  }

  revalidatePath(`/admin/events/${eventId}/registrations`);

  return {
    status: failed > 0 ? "error" : "success",
    message:
      failed > 0
        ? `${issued} refund${issued === 1 ? "" : "s"} issued, ${failed} failed — check the logs.`
        : `${issued} refund${issued === 1 ? "" : "s"} issued. Razorpay confirms each one by webhook.`,
  };
}

/**
 * Full refund for everyone who paid, used when an event becomes sponsored-free
 * after registrations have already been taken.
 */
export async function refundAllForSponsoredEvent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isDbConfigured) {
    return { status: "error", message: "This needs a database connection." };
  }
  if (!razorpayConfigured) {
    return { status: "error", message: "Razorpay is not configured." };
  }
  const admin = await requireAdmin();
  if (!admin) return { status: "error", message: "Admins only." };

  const eventId = String(formData.get("eventId") ?? "");
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, isSponsoredFree: true },
  });
  if (!event) return { status: "error", message: "Event not found." };
  if (!event.isSponsoredFree) {
    return {
      status: "error",
      message: "Mark the event sponsored-free before refunding everyone.",
    };
  }

  const paid = await prisma.registration.findMany({
    where: {
      eventId,
      paymentStatus: "PAID",
      razorpayPaymentId: { not: null },
      refundStatus: { not: "PROCESSED" },
    },
    select: { id: true, razorpayPaymentId: true, amountPaid: true },
  });

  if (paid.length === 0) {
    return { status: "error", message: "Nobody has an outstanding payment." };
  }

  let issued = 0;
  let failed = 0;

  for (const registration of paid) {
    try {
      const refund = await refundPayment({
        paymentId: registration.razorpayPaymentId!,
        amount: registration.amountPaid,
        notes: { registrationId: registration.id, reason: "event_became_sponsored" },
      });
      await prisma.registration.update({
        where: { id: registration.id },
        data: {
          refundStatus: "DUE",
          refundId: refund.id,
          refundAmount: registration.amountPaid,
          paymentStatus: "WAIVED",
        },
      });
      issued += 1;
    } catch (error) {
      console.error(`[refund-all] failed for ${registration.id}`, error);
      failed += 1;
    }
  }

  revalidatePath(`/admin/events/${eventId}/registrations`);
  return {
    status: failed > 0 ? "error" : "success",
    message: `${issued} full refund${issued === 1 ? "" : "s"} issued${failed > 0 ? `, ${failed} failed` : ""}.`,
  };
}

/* ── Scoring ─────────────────────────────────────────────────────────────── */

/**
 * NON-NEGOTIABLE #3: one score row per CANDIDATE per submission, never one per
 * team. Tier assignment and talent-pool onboarding happen in the same action so
 * they cannot drift apart.
 */
export async function saveScore(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isDbConfigured) {
    return { status: "error", message: "This needs a database connection." };
  }
  const admin = await requireAdmin();
  if (!admin) return { status: "error", message: "Admins only." };

  const parsed = scoreSchema.safeParse({
    submissionId: formData.get("submissionId"),
    candidateId: formData.get("candidateId"),
    demo: formData.get("demo"),
    code: formData.get("code"),
    fit: formData.get("fit"),
    viva: formData.get("viva"),
    notes: formData.get("notes") ?? "",
    rank: formData.get("rank") || undefined,
    tier: formData.get("tier") || undefined,
    inTalentPool: formData.get("inTalentPool") === "on",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the scores — each has its own maximum.",
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const input = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.score.upsert({
        where: {
          submissionId_candidateId: {
            submissionId: input.submissionId,
            candidateId: input.candidateId,
          },
        },
        update: {
          demo: input.demo,
          code: input.code,
          fit: input.fit,
          viva: input.viva,
          notes: input.notes || null,
          rank: input.rank ?? null,
          scoredById: admin.id,
        },
        create: {
          submissionId: input.submissionId,
          candidateId: input.candidateId,
          demo: input.demo,
          code: input.code,
          fit: input.fit,
          viva: input.viva,
          notes: input.notes || null,
          rank: input.rank ?? null,
          scoredById: admin.id,
        },
      });

      await tx.candidate.update({
        where: { id: input.candidateId },
        data: {
          ...(input.tier ? { tier: input.tier } : {}),
          inTalentPool: input.inTalentPool,
        },
      });
    });
  } catch (error) {
    console.error("[scoring] save failed", error);
    return { status: "error", message: "We couldn't save that score." };
  }

  revalidatePath("/admin/scoring");
  revalidatePath("/admin/talent");
  return { status: "success", message: "Score saved." };
}

/* ── Admin notes on a candidate ──────────────────────────────────────────── */

export async function saveAdminNote(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isDbConfigured) {
    return { status: "error", message: "This needs a database connection." };
  }
  const admin = await requireAdmin();
  if (!admin) return { status: "error", message: "Admins only." };

  const candidateId = String(formData.get("candidateId") ?? "");
  const note = String(formData.get("adminNote") ?? "").slice(0, 2000);
  if (!candidateId) return { status: "error", message: "Missing candidate." };

  await prisma.candidate.update({
    where: { id: candidateId },
    data: { adminNote: note || null },
  });

  revalidatePath("/admin/talent");
  return { status: "success", message: "Note saved." };
}

/* ── College enquiries ───────────────────────────────────────────────────── */

/**
 * Turns a raw enquiry into a real College record, or links it to one that
 * already exists, and marks the enquiry handled in the same transaction so the
 * queue can't show a lead that has already been actioned.
 */
export async function promoteEnquiryToCollege(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isDbConfigured) {
    return { status: "error", message: "This needs a database connection." };
  }
  const admin = await requireAdmin();
  if (!admin) return { status: "error", message: "Admins only." };

  const enquiryId = String(formData.get("enquiryId") ?? "");
  if (!enquiryId) return { status: "error", message: "Missing enquiry." };

  const enquiry = await prisma.collegeEnquiry.findUnique({
    where: { id: enquiryId },
    select: {
      id: true,
      collegeId: true,
      collegeName: true,
      city: true,
      contactName: true,
      contactRole: true,
      email: true,
      phone: true,
      studentCount: true,
      interestedIn: true,
    },
  });
  if (!enquiry) return { status: "error", message: "Enquiry not found." };
  if (enquiry.collegeId) {
    return { status: "error", message: "This enquiry is already linked to a college." };
  }

  try {
    // Match on name + city so two campuses of the same trust stay separate.
    const existing = await prisma.college.findFirst({
      where: {
        name: { equals: enquiry.collegeName, mode: "insensitive" },
        city: { equals: enquiry.city, mode: "insensitive" },
      },
      select: { id: true },
    });

    await prisma.$transaction(async (tx) => {
      const college =
        existing ??
        (await tx.college.create({
          data: {
            name: enquiry.collegeName,
            city: enquiry.city,
            tpoName: enquiry.contactName,
            tpoEmail: enquiry.email,
            tpoContact: enquiry.phone,
            studentCount: enquiry.studentCount,
            status: "PROSPECT",
            notes: `Promoted from an enquiry. Contact role: ${enquiry.contactRole}. Interested in ${enquiry.interestedIn}.`,
          },
          select: { id: true },
        }));

      await tx.collegeEnquiry.update({
        where: { id: enquiry.id },
        data: { collegeId: college.id, handled: true },
      });
    });
  } catch (error) {
    console.error("[college] promote failed", error);
    return { status: "error", message: "We couldn't create that college record." };
  }

  revalidatePath("/admin/colleges");
  return {
    status: "success",
    message: "College record created and the enquiry marked handled.",
  };
}

export async function toggleEnquiryHandled(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isDbConfigured) {
    return { status: "error", message: "This needs a database connection." };
  }
  const admin = await requireAdmin();
  if (!admin) return { status: "error", message: "Admins only." };

  const enquiryId = String(formData.get("enquiryId") ?? "");
  const enquiry = await prisma.collegeEnquiry.findUnique({
    where: { id: enquiryId },
    select: { id: true, handled: true },
  });
  if (!enquiry) return { status: "error", message: "Enquiry not found." };

  await prisma.collegeEnquiry.update({
    where: { id: enquiry.id },
    data: { handled: !enquiry.handled },
  });

  revalidatePath("/admin/colleges");
  return {
    status: "success",
    message: enquiry.handled ? "Reopened." : "Marked handled.",
  };
}

export async function updateCollegeStatus(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isDbConfigured) {
    return { status: "error", message: "This needs a database connection." };
  }
  const admin = await requireAdmin();
  if (!admin) return { status: "error", message: "Admins only." };

  const collegeId = String(formData.get("collegeId") ?? "");
  const raw = String(formData.get("status") ?? "");
  const allowed: CollegeStatus[] = ["PROSPECT", "ACTIVE", "PAST"];
  const status = allowed.find((value) => value === raw);
  if (!collegeId || !status) return { status: "error", message: "Invalid request." };

  await prisma.college.update({ where: { id: collegeId }, data: { status } });

  revalidatePath("/admin/colleges");
  return { status: "success", message: "Status updated." };
}

/* ── Company flags ───────────────────────────────────────────────────────── */

/**
 * `isHiringPartner` is the flag that puts a company's name in the PUBLIC
 * marquee on the landing page, and `agreementSigned` gates whether we should be
 * making introductions at all. Both are deliberate, confirmed actions rather
 * than one-click toggles.
 */
export async function updateCompanyFlags(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isDbConfigured) {
    return { status: "error", message: "This needs a database connection." };
  }
  const admin = await requireAdmin();
  if (!admin) return { status: "error", message: "Admins only." };

  const companyId = String(formData.get("companyId") ?? "");
  const flag = String(formData.get("flag") ?? "");
  if (!companyId || !["isHiringPartner", "agreementSigned"].includes(flag)) {
    return { status: "error", message: "Invalid request." };
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true, isHiringPartner: true, agreementSigned: true },
  });
  if (!company) return { status: "error", message: "Company not found." };

  const next =
    flag === "isHiringPartner" ? !company.isHiringPartner : !company.agreementSigned;

  await prisma.company.update({
    where: { id: company.id },
    data: { [flag]: next },
  });

  // The marquee is a public claim, so it must invalidate the landing page.
  revalidatePath("/admin/companies");
  if (flag === "isHiringPartner") revalidatePath("/");

  return {
    status: "success",
    message:
      flag === "isHiringPartner"
        ? next
          ? `${company.name} now appears in the public marquee.`
          : `${company.name} removed from the marquee.`
        : next
          ? "Agreement marked signed."
          : "Agreement marked unsigned.",
  };
}

/* ── Requirement triage ──────────────────────────────────────────────────── */

export async function updateRequirementStatus(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isDbConfigured) {
    return { status: "error", message: "This needs a database connection." };
  }
  const admin = await requireAdmin();
  if (!admin) return { status: "error", message: "Admins only." };

  const requirementId = String(formData.get("requirementId") ?? "");
  const raw = String(formData.get("status") ?? "");

  const allowed: RequirementStatus[] = [
    "NEW",
    "QUALIFYING",
    "MATCHING",
    "SHORTLIST_SENT",
    "CLOSED",
    "LOST",
  ];
  const status = allowed.find((value) => value === raw);
  if (!requirementId || !status) {
    return { status: "error", message: "Invalid request." };
  }

  await prisma.requirement.update({
    where: { id: requirementId },
    data: { status },
  });

  revalidatePath("/admin/requirements");
  return { status: "success", message: "Status updated." };
}
