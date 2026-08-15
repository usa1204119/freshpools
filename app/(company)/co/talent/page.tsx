import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma, isDbConfigured } from "@/lib/db";
import { listTalent, talentSkillFacets } from "@/lib/talent";
import { PageTitle, EmptyState, SetupNotice } from "@/components/app/shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { Block, blockAt } from "@/components/ui/block";
import { ShortlistButton } from "@/components/forms/company-forms";
import { cn } from "@/lib/utils";
import type { Tier } from "@prisma/client";

export const metadata: Metadata = { title: "Talent", robots: { index: false } };

const TIERS: Tier[] = ["A", "B", "C"];

export default async function TalentPage({
  searchParams,
}: {
  searchParams: Promise<{ skill?: string; tier?: string }>;
}) {
  const session = await auth();
  if (!isDbConfigured || !session?.user) return <SetupNotice />;

  const params = await searchParams;
  const tier = TIERS.includes(params.tier as Tier) ? (params.tier as Tier) : undefined;

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const [candidates, skills, shortlisted] = await Promise.all([
    listTalent({ skill: params.skill, tier }),
    talentSkillFacets(),
    company
      ? prisma.shortlistItem.findMany({
          where: { companyId: company.id },
          select: { candidateId: true },
        })
      : Promise.resolve([]),
  ]);

  const savedIds = new Set(shortlisted.map((item) => item.candidateId));

  const buildHref = (next: { skill?: string; tier?: string }) => {
    const query = new URLSearchParams();
    const nextSkill = next.skill ?? params.skill;
    const nextTier = next.tier ?? params.tier;
    if (nextSkill && nextSkill !== "all") query.set("skill", nextSkill);
    if (nextTier && nextTier !== "all") query.set("tier", nextTier);
    const qs = query.toString();
    return qs ? `/co/talent?${qs}` : "/co/talent";
  };

  return (
    <>
      <PageTitle
        title="Talent"
        sub="Everyone here has shipped under a deadline, passed a code review, and explained their work on camera. Contact details are shared only after an introduction."
      />

      {skills.length > 0 ? (
        <div className="mb-8 flex flex-col gap-4 border border-ink bg-block-white p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="mono text-eyebrow text-ink-muted">Tier</span>
            <Link
              href={buildHref({ tier: "all" })}
              className={cn(
                "mono border border-ink px-3 py-1.5 text-eyebrow",
                !tier ? "bg-ink text-white" : "bg-block-white",
              )}
            >
              All
            </Link>
            {TIERS.map((option) => (
              <Link
                key={option}
                href={buildHref({ tier: option })}
                className={cn(
                  "mono border border-ink px-3 py-1.5 text-eyebrow",
                  tier === option ? "bg-ink text-white" : "bg-block-white",
                )}
              >
                Tier {option}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="mono text-eyebrow text-ink-muted">Skill</span>
            <Link
              href={buildHref({ skill: "all" })}
              className={cn(
                "mono border border-ink px-3 py-1.5 text-eyebrow",
                !params.skill ? "bg-ink text-white" : "bg-block-white",
              )}
            >
              All
            </Link>
            {skills.map((skill) => (
              <Link
                key={skill}
                href={buildHref({ skill })}
                className={cn(
                  "mono border border-ink px-3 py-1.5 text-eyebrow",
                  params.skill === skill ? "bg-ink text-white" : "bg-block-white",
                )}
              >
                {skill}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {candidates.length === 0 ? (
        <EmptyState
          title="No profiles match that."
          body="The pool grows after each event. If you have a live requirement, we go looking specifically for it rather than waiting for a filter to match."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {candidates.map((candidate, index) => (
            <Block
              key={candidate.id}
              as="li"
              color={blockAt(index)}
              className="flex h-full flex-col gap-4 p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/co/talent/${candidate.id}`}
                    className="font-sans text-[20px] font-bold tracking-[-0.02em] underline-offset-4 hover:underline"
                  >
                    {candidate.maskedName}
                  </Link>
                  <p className="mono mt-1 text-eyebrow text-ink-muted">
                    {candidate.handle}
                  </p>
                </div>
                {candidate.tier ? (
                  <StatusBadge tone="done">Tier {candidate.tier}</StatusBadge>
                ) : null}
              </div>

              <p className="text-[14px] text-ink-muted">
                {candidate.college} · {candidate.gradYear}
              </p>

              <ul className="flex flex-wrap gap-1.5">
                {candidate.skills.slice(0, 6).map((skill) => (
                  <li
                    key={skill}
                    className="mono border border-ink px-1.5 py-0.5 text-eyebrow"
                  >
                    {skill}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-2">
                {candidate.hasVideo ? (
                  <StatusBadge tone="active">Demo video</StatusBadge>
                ) : null}
                <StatusBadge
                  tone={candidate.availability === "PLACED" ? "neutral" : "pending"}
                >
                  {candidate.availability === "LOOKING"
                    ? "Looking"
                    : candidate.availability === "OPEN"
                      ? "Open"
                      : "Placed"}
                </StatusBadge>
              </div>

              <div className="mt-auto flex flex-col gap-2 pt-2">
                <ShortlistButton
                  candidateId={candidate.id}
                  saved={savedIds.has(candidate.id)}
                />
                <Link
                  href={`/co/talent/${candidate.id}`}
                  className="mono text-eyebrow underline underline-offset-4"
                >
                  Open profile →
                </Link>
              </div>
            </Block>
          ))}
        </ul>
      )}
    </>
  );
}
