import "server-only";
import { prisma, safeQuery } from "./db";
import { maskName } from "./utils";

/**
 * Read helpers for public pages. Every one of these degrades to an empty
 * result when the database is unset or unreachable, because several landing
 * sections are required to hide themselves rather than show a zero or a
 * placeholder (NON-NEGOTIABLE #12).
 */

/** Hero line: "VERIFIED THIS SEASON: N CANDIDATES". Zero → caller hides it. */
export async function getVerifiedCandidateCount(): Promise<number> {
  return safeQuery(
    () =>
      prisma.candidate.count({
        where: { inTalentPool: true, tier: { not: null } },
      }),
    0,
  );
}

/** Marquee names. Empty → the whole section does not render. */
export async function getHiringPartners(): Promise<string[]> {
  const partners = await safeQuery(
    () =>
      prisma.company.findMany({
        where: { isHiringPartner: true },
        select: { name: true },
        orderBy: { name: "asc" },
      }),
    [] as { name: string }[],
  );
  return partners.map((p) => p.name);
}

const eventCardSelect = {
  id: true,
  slug: true,
  title: true,
  tagline: true,
  mode: true,
  venue: true,
  city: true,
  startAt: true,
  endAt: true,
  deadline: true,
  status: true,
  prizePool: true,
  registrationFee: true,
  depositAmount: true,
  isSponsoredFree: true,
  coverBlock: true,
  sponsor: { select: { name: true } },
  college: { select: { name: true, city: true } },
  _count: { select: { registrations: true } },
} as const;

export type EventCardData = Awaited<ReturnType<typeof getUpcomingEvents>>[number];

const PUBLIC_STATUSES = [
  "ANNOUNCED",
  "REGISTRATION_OPEN",
  "REGISTRATION_CLOSED",
  "LIVE",
  "JUDGING",
] as const;

export async function getUpcomingEvents() {
  return safeQuery(
    () =>
      prisma.event.findMany({
        where: { status: { in: [...PUBLIC_STATUSES] } },
        select: eventCardSelect,
        orderBy: { startAt: "asc" },
      }),
    [] as Awaited<ReturnType<typeof prisma.event.findMany<{ select: typeof eventCardSelect }>>>,
  );
}

export async function getPastEvents() {
  return safeQuery(
    () =>
      prisma.event.findMany({
        where: { status: "COMPLETED" },
        select: eventCardSelect,
        orderBy: { startAt: "desc" },
      }),
    [] as Awaited<ReturnType<typeof prisma.event.findMany<{ select: typeof eventCardSelect }>>>,
  );
}

export async function getEventBySlug(slug: string) {
  return safeQuery(
    () =>
      prisma.event.findFirst({
        where: { slug, status: { not: "DRAFT" } },
        include: {
          sponsor: { select: { id: true, name: true, website: true } },
          college: { select: { name: true, city: true } },
          prizes: { orderBy: { sortOrder: "asc" } },
          _count: { select: { registrations: true, teams: true } },
        },
      }),
    null,
  );
}

export async function getEventSlugs(): Promise<{ slug: string }[]> {
  return safeQuery(
    () =>
      prisma.event.findMany({
        where: { status: { not: "DRAFT" } },
        select: { slug: true },
      }),
    [],
  );
}

/**
 * Landing-page teaser cards. Names are masked and no contact detail is
 * selected at the query level — the shape simply cannot leak an email.
 */
export async function getSampleProfiles(take = 3) {
  const rows = await safeQuery(
    () =>
      prisma.candidate.findMany({
        where: {
          inTalentPool: true,
          tier: { not: null },
          videoUrl: { not: null },
          availability: { in: ["LOOKING", "OPEN"] },
        },
        select: {
          id: true,
          skills: true,
          tier: true,
          gradYear: true,
          college: true,
          user: { select: { name: true } },
        },
        orderBy: [{ tier: "asc" }, { updatedAt: "desc" }],
        take,
      }),
    [],
  );

  return rows.map((row) => ({
    id: row.id,
    maskedName: maskName(row.user.name),
    skills: row.skills.slice(0, 5),
    tier: row.tier,
    gradYear: row.gradYear,
    college: row.college,
  }));
}

/**
 * Public leaderboard. Rank only — NEVER the raw demo/code/fit/viva numbers.
 */
export async function getLeaderboard(slug: string) {
  const event = await safeQuery(
    () =>
      prisma.event.findFirst({
        where: { slug, status: "COMPLETED" },
        select: { id: true, title: true, slug: true, startAt: true, endAt: true },
      }),
    null,
  );

  if (!event) return null;

  const teams = await safeQuery(
    () =>
      prisma.team.findMany({
        where: { eventId: event.id, submission: { isNot: null } },
        select: {
          id: true,
          name: true,
          submission: {
            select: {
              id: true,
              title: true,
              repoUrl: true,
              videoUrl: true,
              stack: true,
              scores: { select: { rank: true } },
            },
          },
        },
      }),
    [],
  );

  const ranked = teams
    .map((team) => {
      const ranks = team.submission?.scores.map((s) => s.rank).filter(
        (r): r is number => typeof r === "number",
      ) ?? [];
      // A team's placement is the best individual rank on that submission.
      const rank = ranks.length > 0 ? Math.min(...ranks) : null;
      return {
        teamId: team.id,
        teamName: team.name,
        title: team.submission?.title ?? "",
        repoUrl: team.submission?.repoUrl ?? "",
        videoUrl: team.submission?.videoUrl ?? "",
        stack: team.submission?.stack ?? [],
        rank,
      };
    })
    .filter((row) => row.rank !== null)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));

  return { event, rows: ranked };
}
