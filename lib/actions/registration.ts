"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma, isDbConfigured } from "@/lib/db";
import { generateJoinCode } from "@/lib/utils";
import { sendRegistrationReceipt } from "@/lib/email";
import {
  createTeamSchema,
  joinTeamSchema,
  registrationSchema,
  readList,
  zodToFieldErrors,
  type ActionState,
} from "@/lib/validations";

async function currentCandidate() {
  const session = await auth();
  if (!session?.user || session.user.role !== "CANDIDATE") return null;
  const candidate = await prisma.candidate.findUnique({
    where: { userId: session.user.id },
    select: { id: true, user: { select: { email: true, name: true } } },
  });
  return candidate;
}

/**
 * Creates the Registration row. Note what is NOT read from the form: the
 * amount. Fee and deposit come from the Event row, so a crafted request cannot
 * set its own price (NON-NEGOTIABLE #19).
 */
export async function registerForEvent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isDbConfigured) {
    return { status: "error", message: "This needs a database connection." };
  }

  const session = await auth();
  if (!session?.user) {
    return { status: "error", message: "Sign in to register." };
  }
  if (session.user.role !== "CANDIDATE") {
    return {
      status: "error",
      message: "Only candidate accounts can register for events.",
    };
  }

  const parsed = registrationSchema.safeParse({
    eventSlug: formData.get("eventSlug"),
    college: formData.get("college"),
    gradYear: formData.get("gradYear"),
    phone: formData.get("phone"),
    github: formData.get("github"),
    skills: readList(formData, "skills"),
    tshirtSize: formData.get("tshirtSize"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Some fields need another look.",
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const input = parsed.data;

  const event = await prisma.event.findUnique({
    where: { slug: input.eventSlug },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      deadline: true,
      registrationFee: true,
      depositAmount: true,
      isSponsoredFree: true,
      sponsor: { select: { name: true } },
    },
  });

  if (!event) return { status: "error", message: "That event doesn't exist." };

  if (event.status !== "REGISTRATION_OPEN") {
    return { status: "error", message: "Registration is not open for this event." };
  }
  if (event.deadline.getTime() < Date.now()) {
    return { status: "error", message: "The registration deadline has passed." };
  }

  try {
    // Keep the candidate's own profile in step with what they just typed.
    const candidate = await prisma.candidate.upsert({
      where: { userId: session.user.id },
      update: {
        college: input.college,
        gradYear: input.gradYear,
        github: input.github,
        skills: input.skills,
      },
      create: {
        userId: session.user.id,
        college: input.college,
        gradYear: input.gradYear,
        github: input.github,
        skills: input.skills,
      },
      select: { id: true },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { phone: input.phone },
    });

    // A sponsored-free event skips payment entirely.
    const waived = event.isSponsoredFree;

    const registration = await prisma.registration.upsert({
      where: {
        eventId_candidateId: { eventId: event.id, candidateId: candidate.id },
      },
      update: {
        tshirtSize: input.tshirtSize,
        phone: input.phone,
        // Never downgrade a completed payment on a re-submit.
        ...(waived ? { paymentStatus: "WAIVED" as const, amountPaid: 0 } : {}),
      },
      create: {
        eventId: event.id,
        candidateId: candidate.id,
        tshirtSize: input.tshirtSize,
        phone: input.phone,
        paymentStatus: waived ? "WAIVED" : "PENDING",
        refundStatus: "NOT_DUE",
      },
      select: { id: true, paymentStatus: true },
    });

    if (registration.paymentStatus === "WAIVED" && session.user.email) {
      await sendRegistrationReceipt({
        to: session.user.email,
        name: session.user.name ?? "there",
        eventTitle: event.title,
        eventSlug: event.slug,
        amountPaid: 0,
        depositAmount: event.depositAmount,
        waived: true,
        sponsorName: event.sponsor?.name,
      });
    }
  } catch (error) {
    console.error("[registration] failed", error);
    return { status: "error", message: "We couldn't complete that. Try again." };
  }

  revalidatePath(`/hackathons/${input.eventSlug}/register`);
  revalidatePath("/me/hackathons");

  return { status: "success", message: "Details saved." };
}

/**
 * Withdraw from an event.
 *
 * Deliberately does NOT auto-refund. Money out of the system is always an
 * admin action (NON-NEGOTIABLE #6) — a self-serve refund button is exactly the
 * kind of thing that gets abused, and a paid withdrawal needs a human to look
 * at it. Paid registrations are therefore flagged for review rather than
 * deleted, so the payment record survives.
 */
export async function withdrawFromEvent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isDbConfigured) {
    return { status: "error", message: "This needs a database connection." };
  }

  const candidate = await currentCandidate();
  if (!candidate) return { status: "error", message: "Sign in as a candidate." };

  const registrationId = String(formData.get("registrationId") ?? "");
  if (!registrationId) return { status: "error", message: "Missing registration." };

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    select: {
      id: true,
      candidateId: true,
      teamId: true,
      paymentStatus: true,
      checkedIn: true,
      event: {
        select: { id: true, slug: true, endAt: true, status: true, title: true },
      },
      team: { select: { id: true, submission: { select: { submittedAt: true } } } },
    },
  });

  if (!registration || registration.candidateId !== candidate.id) {
    return { status: "error", message: "That registration isn't yours." };
  }

  if (registration.checkedIn) {
    return {
      status: "error",
      message: "You're already checked in at this event — talk to an organiser.",
    };
  }

  if (registration.team?.submission?.submittedAt) {
    return {
      status: "error",
      message:
        "Your team has already submitted. Withdrawing now would break their entry — talk to an organiser.",
    };
  }

  if (registration.event.endAt.getTime() < Date.now()) {
    return { status: "error", message: "This event is already over." };
  }

  const wasPaid = registration.paymentStatus === "PAID";

  try {
    await prisma.$transaction(async (tx) => {
      // Leave the team first so it doesn't keep a phantom member.
      if (registration.teamId) {
        await tx.teamMember
          .delete({
            where: {
              teamId_candidateId: {
                teamId: registration.teamId,
                candidateId: candidate.id,
              },
            },
          })
          .catch(() => undefined);

        const remaining = await tx.teamMember.count({
          where: { teamId: registration.teamId },
        });
        if (remaining === 0) {
          await tx.team.delete({ where: { id: registration.teamId } });
        }
      }

      if (wasPaid) {
        // Keep the row: it holds the razorpayPaymentId an admin needs to
        // refund, and deleting it would lose the audit trail.
        await tx.registration.update({
          where: { id: registration.id },
          data: { teamId: null, refundStatus: "DUE" },
        });
      } else {
        await tx.registration.delete({ where: { id: registration.id } });
      }
    });
  } catch (error) {
    console.error("[registration] withdraw failed", error);
    return { status: "error", message: "We couldn't withdraw you. Try again." };
  }

  revalidatePath("/me/hackathons");
  revalidatePath(`/hackathons/${registration.event.slug}/register`);

  return {
    status: "success",
    message: wasPaid
      ? "Withdrawn. Your payment is flagged for refund review — an organiser will be in touch."
      : "Withdrawn from the event.",
  };
}

/* ── Teams ───────────────────────────────────────────────────────────────── */

export async function createTeam(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isDbConfigured) {
    return { status: "error", message: "This needs a database connection." };
  }

  const candidate = await currentCandidate();
  if (!candidate) return { status: "error", message: "Sign in as a candidate." };

  const parsed = createTeamSchema.safeParse({
    eventSlug: formData.get("eventSlug"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the team name.",
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const event = await prisma.event.findUnique({
    where: { slug: parsed.data.eventSlug },
    select: { id: true },
  });
  if (!event) return { status: "error", message: "That event doesn't exist." };

  const registration = await prisma.registration.findUnique({
    where: {
      eventId_candidateId: { eventId: event.id, candidateId: candidate.id },
    },
    select: { id: true, teamId: true },
  });
  if (!registration) {
    return { status: "error", message: "Register for the event first." };
  }
  if (registration.teamId) {
    return { status: "error", message: "You're already in a team for this event." };
  }

  try {
    // Retry on the (very unlikely) join-code collision rather than 500.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const joinCode = generateJoinCode();
      try {
        const team = await prisma.team.create({
          data: {
            eventId: event.id,
            name: parsed.data.name,
            joinCode,
            leaderId: candidate.id,
            members: { create: { candidateId: candidate.id } },
          },
          select: { id: true, joinCode: true },
        });

        await prisma.registration.update({
          where: { id: registration.id },
          data: { teamId: team.id },
        });

        revalidatePath(`/hackathons/${parsed.data.eventSlug}/register`);
        revalidatePath("/me/hackathons");
        return {
          status: "success",
          message: `Team created. Share this join code: ${team.joinCode}`,
        };
      } catch (error) {
        const code = (error as { code?: string }).code;
        // P2002 = unique constraint. Retry only if it was the join code.
        if (code === "P2002" && attempt < 4) continue;
        if (code === "P2002") {
          return {
            status: "error",
            message: "A team with that name already exists for this event.",
          };
        }
        throw error;
      }
    }
    return { status: "error", message: "Couldn't generate a join code. Try again." };
  } catch (error) {
    console.error("[team] create failed", error);
    return { status: "error", message: "We couldn't create that team." };
  }
}

export async function joinTeam(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isDbConfigured) {
    return { status: "error", message: "This needs a database connection." };
  }

  const candidate = await currentCandidate();
  if (!candidate) return { status: "error", message: "Sign in as a candidate." };

  const parsed = joinTeamSchema.safeParse({
    eventSlug: formData.get("eventSlug"),
    joinCode: formData.get("joinCode"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the join code.",
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const event = await prisma.event.findUnique({
    where: { slug: parsed.data.eventSlug },
    select: { id: true, maxTeamSize: true },
  });
  if (!event) return { status: "error", message: "That event doesn't exist." };

  const team = await prisma.team.findUnique({
    where: { joinCode: parsed.data.joinCode },
    select: { id: true, eventId: true, name: true, _count: { select: { members: true } } },
  });

  if (!team || team.eventId !== event.id) {
    return { status: "error", message: "No team for this event has that code." };
  }
  if (team._count.members >= event.maxTeamSize) {
    return {
      status: "error",
      message: `That team is full (${event.maxTeamSize} is the maximum).`,
    };
  }

  const registration = await prisma.registration.findUnique({
    where: {
      eventId_candidateId: { eventId: event.id, candidateId: candidate.id },
    },
    select: { id: true, teamId: true },
  });
  if (!registration) {
    return { status: "error", message: "Register for the event first." };
  }
  if (registration.teamId) {
    return { status: "error", message: "You're already in a team for this event." };
  }

  try {
    await prisma.$transaction([
      prisma.teamMember.create({
        data: { teamId: team.id, candidateId: candidate.id },
      }),
      prisma.registration.update({
        where: { id: registration.id },
        data: { teamId: team.id },
      }),
    ]);
  } catch (error) {
    console.error("[team] join failed", error);
    return { status: "error", message: "We couldn't add you to that team." };
  }

  revalidatePath(`/hackathons/${parsed.data.eventSlug}/register`);
  revalidatePath("/me/hackathons");
  return { status: "success", message: `You joined ${team.name}.` };
}

export async function leaveTeam(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isDbConfigured) {
    return { status: "error", message: "This needs a database connection." };
  }

  const candidate = await currentCandidate();
  if (!candidate) return { status: "error", message: "Sign in as a candidate." };

  const teamId = String(formData.get("teamId") ?? "");
  const eventSlug = String(formData.get("eventSlug") ?? "");
  if (!teamId) return { status: "error", message: "Missing team." };

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      id: true,
      leaderId: true,
      submission: { select: { id: true, submittedAt: true } },
      _count: { select: { members: true } },
    },
  });
  if (!team) return { status: "error", message: "That team doesn't exist." };

  if (team.submission?.submittedAt) {
    return {
      status: "error",
      message: "This team has already submitted — talk to an organiser instead.",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.teamMember.delete({
        where: { teamId_candidateId: { teamId, candidateId: candidate.id } },
      });
      await tx.registration.updateMany({
        where: { teamId, candidateId: candidate.id },
        data: { teamId: null },
      });

      // Last member out deletes the team so its name and code are freed.
      if (team._count.members <= 1) {
        await tx.team.delete({ where: { id: teamId } });
      } else if (team.leaderId === candidate.id) {
        const next = await tx.teamMember.findFirst({
          where: { teamId },
          orderBy: { joinedAt: "asc" },
          select: { candidateId: true },
        });
        if (next) {
          await tx.team.update({
            where: { id: teamId },
            data: { leaderId: next.candidateId },
          });
        }
      }
    });
  } catch (error) {
    console.error("[team] leave failed", error);
    return { status: "error", message: "We couldn't remove you from that team." };
  }

  if (eventSlug) revalidatePath(`/hackathons/${eventSlug}/register`);
  revalidatePath("/me/hackathons");
  return { status: "success", message: "You left the team." };
}
