"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma, isDbConfigured } from "@/lib/db";
import { clientIp, formLimiter } from "@/lib/rate-limit";
import { sendInternalLead, sendRequirementReceived } from "@/lib/email";
import {
  collegeEnquirySchema,
  requirementSchema,
  readList,
  zodToFieldErrors,
  type ActionState,
} from "@/lib/validations";
import { formatCtcRange } from "@/lib/utils";

/**
 * Both public forms are submitted without a login — deliberately, to keep
 * friction low. That makes rate limiting and server-side validation the only
 * defence, so both run before anything is written.
 */

async function guardRate(bucket: string): Promise<ActionState | null> {
  const ip = clientIp(await headers());
  const { success } = await formLimiter.limit(`${bucket}:${ip}`);
  if (!success) {
    return {
      status: "error",
      message: "Too many submissions from this network. Try again in an hour.",
    };
  }
  return null;
}

/* ── Company requirement (/for-companies) ────────────────────────────────── */

export async function submitRequirement(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const limited = await guardRate("requirement");
  if (limited) return limited;

  const parsed = requirementSchema.safeParse({
    companyName: formData.get("companyName"),
    website: formData.get("website") ?? "",
    contactPerson: formData.get("contactPerson"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    role: formData.get("role"),
    stack: readList(formData, "stack"),
    openings: formData.get("openings"),
    ctcMin: formData.get("ctcMin"),
    ctcMax: formData.get("ctcMax"),
    location: formData.get("location"),
    isRemote: formData.get("isRemote") === "on",
    urgency: formData.get("urgency"),
    sponsorInterest: formData.get("sponsorInterest"),
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Some fields need another look.",
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const input = parsed.data;

  if (!isDbConfigured) {
    // Without a database we still alert the inbox rather than lose the lead.
    await sendInternalLead("New requirement (no DB configured)", [
      ["Company", input.companyName],
      ["Contact", `${input.contactPerson} · ${input.email} · ${input.phone}`],
      ["Role", input.role],
      ["Stack", input.stack.join(", ")],
      ["Openings", String(input.openings)],
      ["CTC", formatCtcRange(input.ctcMin, input.ctcMax)],
      ["Location", input.isRemote ? `${input.location} (remote ok)` : input.location],
      ["Urgency", input.urgency],
      ["Sponsor interest", input.sponsorInterest],
    ]);
    redirect("/for-companies/thank-you");
  }

  try {
    // Match an existing company on name so repeat requirements group together.
    const company = await prisma.company.upsert({
      where: { id: (await findCompanyId(input.companyName)) ?? "__none__" },
      update: {
        website: input.website || undefined,
        contactPerson: input.contactPerson,
        contactEmail: input.email,
        contactPhone: input.phone,
      },
      create: {
        name: input.companyName,
        website: input.website || null,
        contactPerson: input.contactPerson,
        contactEmail: input.email,
        contactPhone: input.phone,
      },
    });

    await prisma.requirement.create({
      data: {
        companyId: company.id,
        role: input.role,
        stack: input.stack,
        openings: input.openings,
        ctcMin: input.ctcMin,
        ctcMax: input.ctcMax,
        location: input.location,
        isRemote: input.isRemote,
        urgency: input.urgency,
        sponsorInterest: input.sponsorInterest,
        notes: input.notes || null,
        status: "NEW",
      },
    });
  } catch (error) {
    console.error("[requirement] failed to save", error);
    return {
      status: "error",
      message:
        "We couldn't save that. Email hello@freshpools.in and we'll pick it up manually.",
    };
  }

  // Fire-and-forget: a mail failure must not lose a saved requirement.
  await Promise.allSettled([
    sendRequirementReceived({
      to: input.email,
      contactName: input.contactPerson,
      companyName: input.companyName,
      role: input.role,
    }),
    sendInternalLead(`New requirement: ${input.role} at ${input.companyName}`, [
      ["Company", input.companyName],
      ["Contact", `${input.contactPerson} · ${input.email} · ${input.phone}`],
      ["Role", input.role],
      ["Stack", input.stack.join(", ")],
      ["Openings", String(input.openings)],
      ["CTC", formatCtcRange(input.ctcMin, input.ctcMax)],
      ["Location", input.isRemote ? `${input.location} (remote ok)` : input.location],
      ["Urgency", input.urgency],
      ["Sponsor interest", input.sponsorInterest],
    ]),
  ]);

  redirect("/for-companies/thank-you");
}

async function findCompanyId(name: string): Promise<string | null> {
  const existing = await prisma.company.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true },
  });
  return existing?.id ?? null;
}

/* ── College enquiry (/for-colleges) ─────────────────────────────────────── */

export async function submitCollegeEnquiry(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const limited = await guardRate("college");
  if (limited) return limited;

  const rawStudentCount = formData.get("studentCount");

  const parsed = collegeEnquirySchema.safeParse({
    collegeName: formData.get("collegeName"),
    city: formData.get("city"),
    contactName: formData.get("contactName"),
    contactRole: formData.get("contactRole"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    studentCount: rawStudentCount ? rawStudentCount : undefined,
    department: formData.get("department") ?? "",
    preferredMonth: formData.get("preferredMonth") ?? "",
    interestedIn: formData.get("interestedIn"),
    message: formData.get("message") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Some fields need another look.",
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const input = parsed.data;

  const summary: [string, string][] = [
    ["College", `${input.collegeName}, ${input.city}`],
    ["Contact", `${input.contactName} (${input.contactRole})`],
    ["Email", input.email],
    ["Phone", input.phone || "—"],
    ["Students", input.studentCount ? String(input.studentCount) : "—"],
    ["Department", input.department || "—"],
    ["Preferred month", input.preferredMonth || "—"],
    ["Interested in", input.interestedIn],
  ];

  if (isDbConfigured) {
    try {
      await prisma.collegeEnquiry.create({
        data: {
          collegeName: input.collegeName,
          city: input.city,
          contactName: input.contactName,
          contactRole: input.contactRole,
          email: input.email,
          phone: input.phone || null,
          studentCount: input.studentCount ?? null,
          department: input.department || null,
          preferredMonth: input.preferredMonth || null,
          interestedIn: input.interestedIn,
          message: input.message || null,
        },
      });
    } catch (error) {
      console.error("[college enquiry] failed to save", error);
      return {
        status: "error",
        message:
          "We couldn't save that. Email hello@freshpools.in and we'll pick it up manually.",
      };
    }
  }

  await sendInternalLead(
    `College enquiry: ${input.collegeName} (${input.interestedIn})`,
    summary,
  );

  redirect("/for-colleges/thank-you");
}
