"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma, isDbConfigured } from "@/lib/db";
import { sendInternalLead } from "@/lib/email";
import { candidateHandle } from "@/lib/utils";
import {
  requirementSchema,
  readList,
  zodToFieldErrors,
  type ActionState,
} from "@/lib/validations";

async function currentCompany() {
  const session = await auth();
  if (!session?.user || session.user.role !== "COMPANY") return null;
  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    select: { id: true, name: true },
  });
  return company;
}

/* ── Shortlist ───────────────────────────────────────────────────────────── */

export async function toggleShortlist(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isDbConfigured) {
    return { status: "error", message: "This needs a database connection." };
  }

  const company = await currentCompany();
  if (!company) return { status: "error", message: "Sign in as a company." };

  const candidateId = String(formData.get("candidateId") ?? "");
  if (!candidateId) return { status: "error", message: "Missing candidate." };

  // Only pool members are shortlistable — this also stops id-guessing.
  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, inTalentPool: true },
    select: { id: true },
  });
  if (!candidate) return { status: "error", message: "That profile isn't available." };

  const existing = await prisma.shortlistItem.findUnique({
    where: { companyId_candidateId: { companyId: company.id, candidateId } },
    select: { id: true },
  });

  try {
    if (existing) {
      await prisma.shortlistItem.delete({ where: { id: existing.id } });
    } else {
      await prisma.shortlistItem.create({
        data: { companyId: company.id, candidateId },
      });
    }
  } catch (error) {
    console.error("[shortlist] toggle failed", error);
    return { status: "error", message: "We couldn't update your shortlist." };
  }

  revalidatePath("/co/talent");
  revalidatePath(`/co/talent/${candidateId}`);
  revalidatePath("/co/shortlist");

  return {
    status: "success",
    message: existing ? "Removed from shortlist." : "Saved to shortlist.",
  };
}

/* ── Introduction requests ───────────────────────────────────────────────── */

const introRequestSchema = z.object({
  candidateId: z.string().trim().min(1),
  requirementId: z.string().trim().optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

/**
 * A company can ASK for an introduction — it cannot make one.
 * An admin reviews the request and asks the candidate before any Intro exists
 * (NON-NEGOTIABLE #1).
 */
export async function requestIntroduction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isDbConfigured) {
    return { status: "error", message: "This needs a database connection." };
  }

  const company = await currentCompany();
  if (!company) return { status: "error", message: "Sign in as a company." };

  const parsed = introRequestSchema.safeParse({
    candidateId: formData.get("candidateId"),
    requirementId: formData.get("requirementId") ?? "",
    message: formData.get("message") ?? "",
  });
  if (!parsed.success) {
    return { status: "error", message: "Invalid request." };
  }

  const { candidateId, requirementId, message } = parsed.data;

  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, inTalentPool: true },
    select: { id: true },
  });
  if (!candidate) return { status: "error", message: "That profile isn't available." };

  const alreadyPending = await prisma.introRequest.findFirst({
    where: { companyId: company.id, candidateId, status: "PENDING" },
    select: { id: true },
  });
  if (alreadyPending) {
    return {
      status: "success",
      message: "You've already asked about this candidate — we're on it.",
    };
  }

  try {
    await prisma.introRequest.create({
      data: {
        companyId: company.id,
        candidateId,
        requirementId: requirementId || null,
        message: message || null,
      },
    });
  } catch (error) {
    console.error("[intro request] failed", error);
    return { status: "error", message: "We couldn't send that request." };
  }

  await sendInternalLead(`Intro requested: ${company.name}`, [
    ["Company", company.name],
    ["Candidate", candidateHandle(candidateId)],
    ["Requirement", requirementId || "—"],
    ["Message", message || "—"],
  ]);

  revalidatePath(`/co/talent/${candidateId}`);
  revalidatePath("/co/pipeline");

  return {
    status: "success",
    message: "Requested. We'll ask the candidate and come back to you.",
  };
}

/* ── Requirements from inside the app ────────────────────────────────────── */

export async function createRequirement(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isDbConfigured) {
    return { status: "error", message: "This needs a database connection." };
  }

  const session = await auth();
  const company = await currentCompany();
  if (!company || !session?.user) {
    return { status: "error", message: "Sign in as a company." };
  }

  const parsed = requirementSchema.safeParse({
    companyName: company.name,
    website: "",
    contactPerson: session.user.name ?? "—",
    email: session.user.email ?? "",
    phone: formData.get("phone") ?? "",
    role: formData.get("role"),
    stack: readList(formData, "stack"),
    openings: formData.get("openings"),
    ctcMin: formData.get("ctcMin"),
    ctcMax: formData.get("ctcMax"),
    location: formData.get("location"),
    isRemote: formData.get("isRemote") === "on",
    urgency: formData.get("urgency"),
    sponsorInterest: formData.get("sponsorInterest") ?? "no",
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

  try {
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
    console.error("[requirement] create failed", error);
    return { status: "error", message: "We couldn't save that requirement." };
  }

  await sendInternalLead(`New requirement: ${input.role} at ${company.name}`, [
    ["Company", company.name],
    ["Role", input.role],
    ["Stack", input.stack.join(", ")],
    ["Openings", String(input.openings)],
  ]);

  revalidatePath("/co/requirements");
  revalidatePath("/co");

  return { status: "success", message: "Requirement posted. We'll come back within 7 days." };
}
