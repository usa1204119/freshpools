"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma, isDbConfigured } from "@/lib/db";
import { slugify } from "@/lib/utils";
import {
  eventSchema,
  prizeSchema,
  readList,
  zodToFieldErrors,
  type ActionState,
} from "@/lib/validations";
import type { EventStatus } from "@prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session.user;
}

function parseEventForm(formData: FormData) {
  const title = String(formData.get("title") ?? "");
  const rawSlug = String(formData.get("slug") ?? "").trim();

  return eventSchema.safeParse({
    id: formData.get("id") || undefined,
    title,
    // Blank slug derives from the title, so the common case is one less field.
    slug: rawSlug || slugify(title),
    tagline: formData.get("tagline") ?? "",
    problemStatement: formData.get("problemStatement"),
    mode: formData.get("mode"),
    venue: formData.get("venue") ?? "",
    city: formData.get("city") ?? "",
    collegeId: formData.get("collegeId") ?? "",
    sponsorId: formData.get("sponsorId") ?? "",
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt"),
    deadline: formData.get("deadline"),
    status: formData.get("status"),
    prizePool: formData.get("prizePool") || undefined,
    minTeamSize: formData.get("minTeamSize"),
    maxTeamSize: formData.get("maxTeamSize"),
    tracks: readList(formData, "tracks"),
    rules: readList(formData, "rules"),
    registrationFee: formData.get("registrationFee"),
    depositAmount: formData.get("depositAmount"),
    isSponsoredFree: formData.get("isSponsoredFree") === "on",
    coverBlock: formData.get("coverBlock") ?? "blue",
  });
}

export async function saveEvent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isDbConfigured) {
    return { status: "error", message: "This needs a database connection." };
  }
  const admin = await requireAdmin();
  if (!admin) return { status: "error", message: "Admins only." };

  const parsed = parseEventForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Some fields need another look.",
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const { id, ...input } = parsed.data;

  const data = {
    title: input.title,
    slug: input.slug,
    tagline: input.tagline || null,
    problemStatement: input.problemStatement,
    mode: input.mode,
    venue: input.venue || null,
    city: input.city || null,
    collegeId: input.collegeId || null,
    sponsorId: input.sponsorId || null,
    startAt: input.startAt,
    endAt: input.endAt,
    deadline: input.deadline,
    status: input.status,
    prizePool: input.prizePool ?? null,
    minTeamSize: input.minTeamSize,
    maxTeamSize: input.maxTeamSize,
    tracks: input.tracks,
    rules: input.rules,
    registrationFee: input.registrationFee,
    depositAmount: input.depositAmount,
    isSponsoredFree: input.isSponsoredFree,
    coverBlock: input.coverBlock,
  };

  let eventId = id;

  try {
    if (id) {
      await prisma.event.update({ where: { id }, data });
    } else {
      const created = await prisma.event.create({ data, select: { id: true } });
      eventId = created.id;
    }
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return {
        status: "error",
        message: "That slug is already taken.",
        fieldErrors: { slug: ["Another event already uses this slug"] },
      };
    }
    console.error("[event] save failed", error);
    return { status: "error", message: "We couldn't save that event." };
  }

  revalidatePath("/admin/events");
  revalidatePath("/hackathons");
  revalidatePath(`/hackathons/${input.slug}`);

  // A new event goes straight to its edit page so prizes can be added.
  if (!id && eventId) redirect(`/admin/events/${eventId}?created=1`);

  return { status: "success", message: "Event saved." };
}

/**
 * Status-only transition, used by the quick controls on the event list.
 * Kept separate from `saveEvent` so moving an event to LIVE doesn't require
 * re-validating (and re-submitting) the whole form.
 */
export async function updateEventStatus(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isDbConfigured) {
    return { status: "error", message: "This needs a database connection." };
  }
  const admin = await requireAdmin();
  if (!admin) return { status: "error", message: "Admins only." };

  const eventId = String(formData.get("eventId") ?? "");
  const raw = String(formData.get("status") ?? "");

  const allowed: EventStatus[] = [
    "DRAFT",
    "ANNOUNCED",
    "REGISTRATION_OPEN",
    "REGISTRATION_CLOSED",
    "LIVE",
    "JUDGING",
    "COMPLETED",
    "CANCELLED",
  ];
  const status = allowed.find((value) => value === raw);
  if (!eventId || !status) return { status: "error", message: "Invalid request." };

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { slug: true, problemStatement: true, startAt: true, deadline: true },
  });
  if (!event) return { status: "error", message: "Event not found." };

  // Opening registration on an unfinished event would publish a broken page.
  if (status === "REGISTRATION_OPEN") {
    if (event.problemStatement.trim().length < 80) {
      return {
        status: "error",
        message: "Write the problem statement before opening registration.",
      };
    }
    if (event.deadline.getTime() < Date.now()) {
      return {
        status: "error",
        message: "The registration deadline is already in the past.",
      };
    }
  }

  await prisma.event.update({ where: { id: eventId }, data: { status } });

  revalidatePath("/admin/events");
  revalidatePath("/hackathons");
  revalidatePath(`/hackathons/${event.slug}`);
  return { status: "success", message: `Status set to ${status.replace(/_/g, " ")}.` };
}

/* ── Prizes ──────────────────────────────────────────────────────────────── */

export async function addPrize(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isDbConfigured) {
    return { status: "error", message: "This needs a database connection." };
  }
  const admin = await requireAdmin();
  if (!admin) return { status: "error", message: "Admins only." };

  const parsed = prizeSchema.safeParse({
    eventId: formData.get("eventId"),
    rank: formData.get("rank"),
    amount: formData.get("amount") || undefined,
    perk: formData.get("perk") ?? "",
    sortOrder: formData.get("sortOrder") || 0,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the prize details.",
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const input = parsed.data;
  if (!input.amount && !input.perk) {
    return {
      status: "error",
      message: "A prize needs either an amount or a perk.",
    };
  }

  await prisma.prize.create({
    data: {
      eventId: input.eventId,
      rank: input.rank,
      amount: input.amount ?? null,
      perk: input.perk || null,
      sortOrder: input.sortOrder,
    },
  });

  revalidatePath(`/admin/events/${input.eventId}`);
  return { status: "success", message: "Prize added." };
}

export async function deletePrize(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isDbConfigured) {
    return { status: "error", message: "This needs a database connection." };
  }
  const admin = await requireAdmin();
  if (!admin) return { status: "error", message: "Admins only." };

  const prizeId = String(formData.get("prizeId") ?? "");
  if (!prizeId) return { status: "error", message: "Missing prize." };

  const prize = await prisma.prize.findUnique({
    where: { id: prizeId },
    select: { eventId: true },
  });
  if (!prize) return { status: "error", message: "Prize not found." };

  await prisma.prize.delete({ where: { id: prizeId } });

  revalidatePath(`/admin/events/${prize.eventId}`);
  return { status: "success", message: "Prize removed." };
}
