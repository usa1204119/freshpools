import type { Metadata } from "next";
import { prisma, isDbConfigured } from "@/lib/db";
import { PageTitle, EmptyState, SetupNotice, StatRow, StatTile } from "@/components/app/shell";
import { Block, blockAt } from "@/components/ui/block";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminNoteForm } from "@/components/forms/admin-forms";
import { candidateHandle, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Talent pool", robots: { index: false } };

export default async function AdminTalentPage() {
  if (!isDbConfigured) return <SetupNotice />;

  const candidates = await prisma.candidate.findMany({
    where: { OR: [{ inTalentPool: true }, { tier: { not: null } }] },
    orderBy: [{ inTalentPool: "desc" }, { tier: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      college: true,
      gradYear: true,
      skills: true,
      tier: true,
      availability: true,
      inTalentPool: true,
      adminNote: true,
      videoUrl: true,
      github: true,
      updatedAt: true,
      user: { select: { name: true, email: true, phone: true } },
      _count: { select: { intros: true, scores: true } },
    },
  });

  const listed = candidates.filter((c) => c.inTalentPool).length;
  const looking = candidates.filter((c) => c.availability === "LOOKING").length;
  const withVideo = candidates.filter((c) => Boolean(c.videoUrl)).length;

  return (
    <>
      <PageTitle
        title="Talent pool"
        sub="Admin view — includes contact details and internal notes that companies never see."
      />

      <StatRow>
        <StatTile label="Rated candidates" value={candidates.length} />
        <StatTile label="In the pool" value={listed} tone="blue" />
        <StatTile label="Actively looking" value={looking} tone="yellow" />
        <StatTile label="With demo video" value={withVideo} tone="ink" />
      </StatRow>

      <div className="mt-10">
        {candidates.length === 0 ? (
          <EmptyState
            title="Nobody in the pool yet."
            body="Candidates are onboarded from the scoring page after their work is reviewed."
          />
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {candidates.map((candidate, index) => (
              <Block
                key={candidate.id}
                as="li"
                color={blockAt(index)}
                className="flex h-full flex-col gap-4 p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-sans text-[20px] font-bold tracking-[-0.02em]">
                      {candidate.user.name}
                    </p>
                    <p className="mono mt-1 text-eyebrow text-ink-muted">
                      {candidateHandle(candidate.id)} · {candidate.college} ·{" "}
                      {candidate.gradYear}
                    </p>
                    <p className="mono mt-1 text-eyebrow text-ink-muted">
                      {candidate.user.email}
                      {candidate.user.phone ? ` · ${candidate.user.phone}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {candidate.tier ? (
                      <StatusBadge tone="done">Tier {candidate.tier}</StatusBadge>
                    ) : null}
                    {candidate.inTalentPool ? (
                      <StatusBadge tone="active">In pool</StatusBadge>
                    ) : (
                      <StatusBadge tone="neutral">Not listed</StatusBadge>
                    )}
                  </div>
                </div>

                <ul className="flex flex-wrap gap-1.5">
                  {candidate.skills.slice(0, 8).map((skill) => (
                    <li
                      key={skill}
                      className="mono border border-ink px-1.5 py-0.5 text-eyebrow"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>

                <p className="mono text-eyebrow text-ink-muted">
                  {candidate._count.scores} scored ·{" "}
                  {candidate._count.intros} intro
                  {candidate._count.intros === 1 ? "" : "s"} · updated{" "}
                  {formatDate(candidate.updatedAt)}
                </p>

                <div className="mt-auto border-t border-ink pt-4">
                  <p className="mono mb-2 text-eyebrow">Internal note</p>
                  <AdminNoteForm
                    candidateId={candidate.id}
                    note={candidate.adminNote}
                  />
                </div>
              </Block>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
