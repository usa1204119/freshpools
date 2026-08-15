import "server-only";
import { prisma } from "./db";
import { candidateHandle, maskName } from "./utils";
import type { Prisma, Tier } from "@prisma/client";

/**
 * Company-facing candidate reads.
 *
 * NON-NEGOTIABLE #1: a company must never see a candidate's email or phone.
 * That is enforced structurally here — the Prisma `select` below simply does
 * not include those columns, so no downstream mistake can leak them. Do not
 * add `email`, `phone`, or `adminNote` to this selection.
 */
const talentSelect = {
  id: true,
  college: true,
  gradYear: true,
  skills: true,
  github: true,
  linkedin: true,
  resumeUrl: true,
  videoUrl: true,
  tier: true,
  availability: true,
  user: { select: { name: true } },
} satisfies Prisma.CandidateSelect;

export type TalentCard = {
  id: string;
  handle: string;
  maskedName: string;
  college: string;
  gradYear: number;
  skills: string[];
  tier: Tier | null;
  availability: string;
  hasVideo: boolean;
  videoUrl: string | null;
  github: string;
  linkedin: string | null;
  resumeUrl: string | null;
};

type TalentRow = Prisma.CandidateGetPayload<{ select: typeof talentSelect }>;

function toCard(row: TalentRow): TalentCard {
  return {
    id: row.id,
    handle: candidateHandle(row.id),
    maskedName: maskName(row.user.name),
    college: row.college,
    gradYear: row.gradYear,
    skills: row.skills,
    tier: row.tier,
    availability: row.availability,
    hasVideo: Boolean(row.videoUrl),
    videoUrl: row.videoUrl,
    github: row.github,
    linkedin: row.linkedin,
    resumeUrl: row.resumeUrl,
  };
}

export interface TalentFilters {
  skill?: string;
  tier?: Tier;
  gradYear?: number;
  availability?: "LOOKING" | "OPEN" | "PLACED";
}

export async function listTalent(filters: TalentFilters = {}): Promise<TalentCard[]> {
  const rows = await prisma.candidate.findMany({
    where: {
      inTalentPool: true,
      tier: filters.tier ?? { not: null },
      ...(filters.skill ? { skills: { has: filters.skill } } : {}),
      ...(filters.gradYear ? { gradYear: filters.gradYear } : {}),
      ...(filters.availability ? { availability: filters.availability } : {}),
    },
    select: talentSelect,
    orderBy: [{ tier: "asc" }, { updatedAt: "desc" }],
    take: 100,
  });

  return rows.map(toCard);
}

/**
 * Full company-facing profile. Includes the demo video, repository and event
 * history — and still no contact details.
 */
export async function getTalentProfile(id: string) {
  const row = await prisma.candidate.findFirst({
    where: { id, inTalentPool: true },
    select: {
      ...talentSelect,
      scores: {
        select: {
          rank: true,
          submission: {
            select: {
              title: true,
              description: true,
              repoUrl: true,
              videoUrl: true,
              stack: true,
              team: {
                select: {
                  name: true,
                  event: { select: { title: true, slug: true, startAt: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!row) return null;

  return {
    ...toCard(row),
    history: row.scores.map((score) => ({
      rank: score.rank,
      projectTitle: score.submission.title,
      projectDescription: score.submission.description,
      repoUrl: score.submission.repoUrl,
      videoUrl: score.submission.videoUrl,
      stack: score.submission.stack,
      teamName: score.submission.team.name,
      eventTitle: score.submission.team.event.title,
      eventSlug: score.submission.team.event.slug,
      eventDate: score.submission.team.event.startAt,
    })),
  };
}

/** Distinct skills across the pool, for the filter chips. */
export async function talentSkillFacets(): Promise<string[]> {
  const rows = await prisma.candidate.findMany({
    where: { inTalentPool: true },
    select: { skills: true },
    take: 500,
  });
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const skill of row.skills) {
      counts.set(skill, (counts.get(skill) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 16)
    .map(([skill]) => skill);
}
