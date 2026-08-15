import type { Metadata } from "next";
import Link from "next/link";
import { prisma, isDbConfigured } from "@/lib/db";
import { PageTitle, EmptyState, SetupNotice } from "@/components/app/shell";
import { Block } from "@/components/ui/block";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScoreForm } from "@/components/forms/admin-forms";
import { VideoEmbed } from "@/components/app/video-embed";
import { JUDGING_CRITERIA } from "@/lib/content";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Scoring", robots: { index: false } };

export default async function ScoringPage({
  searchParams,
}: {
  searchParams: Promise<{ submission?: string }>;
}) {
  if (!isDbConfigured) return <SetupNotice />;

  const { submission: selectedId } = await searchParams;

  const submissions = await prisma.submission.findMany({
    where: { submittedAt: { not: null } },
    orderBy: { submittedAt: "asc" },
    select: {
      id: true,
      title: true,
      team: { select: { name: true, event: { select: { title: true } } } },
      _count: { select: { scores: true } },
    },
  });

  const active = selectedId
    ? await prisma.submission.findUnique({
        where: { id: selectedId },
        select: {
          id: true,
          title: true,
          description: true,
          repoUrl: true,
          videoUrl: true,
          stack: true,
          contributions: true,
          team: {
            select: {
              name: true,
              event: { select: { title: true } },
              members: {
                select: {
                  candidate: {
                    select: {
                      id: true,
                      tier: true,
                      inTalentPool: true,
                      user: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
          scores: {
            select: {
              candidateId: true,
              demo: true,
              code: true,
              fit: true,
              viva: true,
              notes: true,
              rank: true,
            },
          },
        },
      })
    : null;

  return (
    <>
      <PageTitle
        title="Scoring"
        sub="One score per person, never per team. Only rank is ever published."
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
        <aside>
          <h2 className="mono mb-4 text-label">Submitted projects</h2>
          {submissions.length === 0 ? (
            <EmptyState
              title="Nothing to score."
              body="Projects appear once a team submits and locks them."
            />
          ) : (
            <ul className="flex flex-col border border-ink bg-block-white">
              {submissions.map((submission) => (
                <li key={submission.id} className="border-b border-ink last:border-b-0">
                  <Link
                    href={`/admin/scoring?submission=${submission.id}`}
                    className={cn(
                      "block p-4 hover:bg-block-yellow",
                      selectedId === submission.id && "bg-block-blue",
                    )}
                  >
                    <p className="text-[15px] font-medium">{submission.title}</p>
                    <p className="mono mt-1 text-eyebrow text-ink-muted">
                      {submission.team.event.title} · {submission.team.name}
                    </p>
                    <p className="mono mt-2 text-eyebrow">
                      {submission._count.scores === 0 ? (
                        <StatusBadge tone="attention">Unscored</StatusBadge>
                      ) : (
                        <StatusBadge tone="done">
                          {submission._count.scores} scored
                        </StatusBadge>
                      )}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section aria-live="polite">
          {!active ? (
            <EmptyState
              title="Pick a submission."
              body="Choose a project on the left to review the repository, watch the demo, and score each member individually."
            />
          ) : (
            <div className="flex flex-col gap-8">
              <Block color="white" className="p-6">
                <p className="mono text-eyebrow text-ink-muted">
                  {active.team.event.title} · {active.team.name}
                </p>
                <h2 className="mt-2 font-sans text-[26px] font-bold tracking-[-0.02em]">
                  {active.title}
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
                  {active.description}
                </p>

                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {active.stack.map((tech) => (
                    <li
                      key={tech}
                      className="mono border border-ink px-1.5 py-0.5 text-eyebrow"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex flex-wrap gap-4 border-t border-ink pt-4">
                  <a
                    href={active.repoUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mono text-eyebrow underline underline-offset-4"
                  >
                    Read the repository ↗
                  </a>
                  <a
                    href={active.videoUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mono text-eyebrow underline underline-offset-4"
                  >
                    Open demo ↗
                  </a>
                </div>
              </Block>

              <VideoEmbed url={active.videoUrl} title={`${active.title} — demo`} />

              <Block color="blue" className="p-6">
                <p className="mono mb-3 text-eyebrow">Who built what</p>
                <p className="text-[15px] leading-relaxed whitespace-pre-line">
                  {active.contributions}
                </p>
              </Block>

              <div>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="mono text-label">Score each person</h3>
                  <p className="mono text-eyebrow text-ink-muted">
                    {JUDGING_CRITERIA.map((c) => `${c.label} ${c.weight}`).join(" · ")}
                  </p>
                </div>

                <div className="flex flex-col gap-5">
                  {active.team.members.map((member) => {
                    const existing = active.scores.find(
                      (score) => score.candidateId === member.candidate.id,
                    );
                    return (
                      <ScoreForm
                        key={member.candidate.id}
                        submissionId={active.id}
                        candidateId={member.candidate.id}
                        candidateName={member.candidate.user.name}
                        defaults={{
                          demo: existing?.demo,
                          code: existing?.code,
                          fit: existing?.fit,
                          viva: existing?.viva,
                          notes: existing?.notes ?? "",
                          rank: existing?.rank ?? undefined,
                          tier: member.candidate.tier,
                          inTalentPool: member.candidate.inTalentPool,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
