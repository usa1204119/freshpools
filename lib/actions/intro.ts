"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma, isDbConfigured } from "@/lib/db";
import { addDays } from "@/lib/utils";
import { sendIntroNotice } from "@/lib/email";
import {
  introSchema,
  introUpdateSchema,
  zodToFieldErrors,
  type ActionState,
} from "@/lib/validations";
import type { IntroStatus } from "@prisma/client";

/** The clearance window before a placement fee becomes collectable. */
const CLEARANCE_DAYS = 90;

/**
 * Every status move is written to IntroEvent as well as Intro.
 * NON-NEGOTIABLE #4: the ledger is the proof in a dispute, so the audit trail
 * is append-only and never skipped.
 */
async function recordTransition(
  introId: string,
  from: IntroStatus | null,
  to: IntroStatus,
  actorId: string | null,
  note?: string,
) {
  await prisma.introEvent.create({
    data: { introId, from, to, actorId, note: note || null },
  });
}

/* ── Candidate side: consent ─────────────────────────────────────────────── */

export async function respondToIntro(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isDbConfigured) {
    return { status: "error", message: "This needs a database connection." };
  }

  const session = await auth();
  if (!session?.user || session.user.role !== "CANDIDATE") {
    return { status: "error", message: "Sign in as a candidate." };
  }

  const introId = String(formData.get("introId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!introId || !["accept", "decline"].includes(decision)) {
    return { status: "error", message: "Invalid request." };
  }

  const candidate = await prisma.candidate.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!candidate) return { status: "error", message: "Complete your profile first." };

  const intro = await prisma.intro.findUnique({
    where: { id: introId },
    select: { id: true, candidateId: true, status: true },
  });
  if (!intro || intro.candidateId !== candidate.id) {
    return { status: "error", message: "That introduction isn't yours." };
  }
  if (intro.status !== "SENT") {
    return { status: "error", message: "You've already responded to this one." };
  }

  const next: IntroStatus = decision === "accept" ? "ACCEPTED" : "WITHDRAWN";

  try {
    await prisma.intro.update({ where: { id: intro.id }, data: { status: next } });
    await recordTransition(
      intro.id,
      intro.status,
      next,
      session.user.id,
      "Candidate response",
    );
  } catch (error) {
    console.error("[intro] candidate response failed", error);
    return { status: "error", message: "We couldn't record that. Try again." };
  }

  revalidatePath("/me/opportunities");
  return {
    status: "success",
    message:
      decision === "accept"
        ? "Shared. We'll put you in touch with them."
        : "Declined. We won't pass on your details.",
  };
}

/* ── Admin side: create and advance ──────────────────────────────────────── */

export async function createIntros(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isDbConfigured) {
    return { status: "error", message: "This needs a database connection." };
  }

  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { status: "error", message: "Admins only." };
  }

  const parsed = introSchema.safeParse({
    requirementId: formData.get("requirementId"),
    candidateIds: formData.getAll("candidateIds").map(String),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Pick at least one candidate.",
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const { requirementId, candidateIds, note } = parsed.data;

  const requirement = await prisma.requirement.findUnique({
    where: { id: requirementId },
    select: { id: true, role: true, company: { select: { name: true } } },
  });
  if (!requirement) return { status: "error", message: "Requirement not found." };

  let created = 0;

  for (const candidateId of candidateIds) {
    try {
      const intro = await prisma.intro.create({
        data: { requirementId, candidateId, status: "SENT" },
        select: {
          id: true,
          candidate: {
            select: { user: { select: { email: true, name: true } } },
          },
        },
      });

      await recordTransition(intro.id, null, "SENT", session.user.id, note || undefined);
      created += 1;

      const email = intro.candidate.user.email;
      if (email) {
        await sendIntroNotice({
          to: email,
          candidateName: intro.candidate.user.name ?? "there",
          companyName: requirement.company.name,
          role: requirement.role,
        });
      }
    } catch (error) {
      // A duplicate intro for the same pair is expected on a re-submit.
      if ((error as { code?: string }).code === "P2002") continue;
      console.error("[intro] create failed", error);
    }
  }

  await prisma.requirement.update({
    where: { id: requirementId },
    data: { status: "SHORTLIST_SENT" },
  });

  revalidatePath("/admin/intros");
  revalidatePath(`/admin/matching/${requirementId}`);
  revalidatePath("/admin/requirements");

  return {
    status: "success",
    message: `${created} introduction${created === 1 ? "" : "s"} sent.`,
  };
}

export async function updateIntro(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isDbConfigured) {
    return { status: "error", message: "This needs a database connection." };
  }

  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { status: "error", message: "Admins only." };
  }

  const parsed = introUpdateSchema.safeParse({
    introId: formData.get("introId"),
    status: formData.get("status"),
    offerCtc: formData.get("offerCtc") || undefined,
    feeAmount: formData.get("feeAmount") || undefined,
    joinedAt: formData.get("joinedAt") ?? "",
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the values.",
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const input = parsed.data;

  const existing = await prisma.intro.findUnique({
    where: { id: input.introId },
    select: { id: true, status: true, joinedAt: true },
  });
  if (!existing) return { status: "error", message: "Introduction not found." };

  // JOINED starts the 90-day clock. Everything downstream reads clearsAt.
  const joinedAt =
    input.status === "JOINED"
      ? input.joinedAt
        ? new Date(input.joinedAt)
        : (existing.joinedAt ?? new Date())
      : existing.joinedAt;

  const clearsAt = joinedAt ? addDays(joinedAt, CLEARANCE_DAYS) : null;

  const feeStatus =
    input.status === "PAID"
      ? "PAID"
      : input.status === "CLEARED"
        ? "DUE"
        : input.status === "JOINED"
          ? "NOT_DUE"
          : undefined;

  try {
    await prisma.intro.update({
      where: { id: input.introId },
      data: {
        status: input.status,
        joinedAt,
        clearsAt,
        offerCtc: input.offerCtc ?? undefined,
        feeAmount: input.feeAmount ?? undefined,
        ...(feeStatus ? { feeStatus } : {}),
      },
    });

    await recordTransition(
      input.introId,
      existing.status,
      input.status,
      session.user.id,
      input.note || undefined,
    );
  } catch (error) {
    console.error("[intro] update failed", error);
    return { status: "error", message: "We couldn't save that." };
  }

  revalidatePath("/admin/intros");
  return { status: "success", message: "Ledger updated." };
}
