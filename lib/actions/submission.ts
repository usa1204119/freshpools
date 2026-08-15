"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma, isDbConfigured } from "@/lib/db";
import {
  submissionSchema,
  readList,
  zodToFieldErrors,
  type ActionState,
} from "@/lib/validations";

/**
 * Saves or submits a team's project.
 *
 * The deadline lock is enforced here, on the server, against the Event row —
 * a disabled button in the UI is a courtesy, not a control.
 */
export async function saveSubmission(
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

  const parsed = submissionSchema.safeParse({
    teamId: formData.get("teamId"),
    title: formData.get("title"),
    description: formData.get("description"),
    repoUrl: formData.get("repoUrl"),
    videoUrl: formData.get("videoUrl"),
    stack: readList(formData, "stack"),
    contributions: formData.get("contributions"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Some fields need another look.",
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const input = parsed.data;
  const finalise = formData.get("intent") === "submit";

  const candidate = await prisma.candidate.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!candidate) return { status: "error", message: "Complete your profile first." };

  const team = await prisma.team.findUnique({
    where: { id: input.teamId },
    select: {
      id: true,
      event: { select: { id: true, slug: true, endAt: true, status: true } },
      members: { select: { candidateId: true } },
      submission: { select: { id: true, submittedAt: true } },
    },
  });
  if (!team) return { status: "error", message: "That team doesn't exist." };

  // Only a member of the team may touch its submission.
  if (!team.members.some((member) => member.candidateId === candidate.id)) {
    return { status: "error", message: "You're not on that team." };
  }

  const closed = team.event.endAt.getTime() < Date.now();
  if (closed) {
    return {
      status: "error",
      message: "The submission window has closed. Talk to an organiser.",
    };
  }
  if (team.submission?.submittedAt) {
    return {
      status: "error",
      message: "This project is already submitted and locked.",
    };
  }

  try {
    await prisma.submission.upsert({
      where: { teamId: team.id },
      update: {
        title: input.title,
        description: input.description,
        repoUrl: input.repoUrl,
        videoUrl: input.videoUrl,
        stack: input.stack,
        contributions: input.contributions,
        ...(finalise ? { submittedAt: new Date() } : {}),
      },
      create: {
        teamId: team.id,
        title: input.title,
        description: input.description,
        repoUrl: input.repoUrl,
        videoUrl: input.videoUrl,
        stack: input.stack,
        contributions: input.contributions,
        submittedAt: finalise ? new Date() : null,
      },
    });
  } catch (error) {
    console.error("[submission] save failed", error);
    return { status: "error", message: "We couldn't save that. Try again." };
  }

  revalidatePath(`/me/team/${team.id}`);
  revalidatePath("/me/hackathons");

  return {
    status: "success",
    message: finalise
      ? "Submitted and locked. Good luck."
      : "Draft saved. You can keep editing until you submit.",
  };
}
