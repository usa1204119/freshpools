import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma, isDbConfigured } from "@/lib/db";
import { PageTitle, SetupNotice, EmptyState } from "@/components/app/shell";
import { Block } from "@/components/ui/block";
import { StatusBadge, introTone, humanizeEnum } from "@/components/ui/status-badge";
import { SendIntrosForm } from "@/components/forms/admin-forms";
import { formatCtcRange, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Matching", robots: { index: false } };

export default async function MatchingPage({
  params,
}: {
  params: Promise<{ reqId: string }>;
}) {
  const { reqId } = await params;
  if (!isDbConfigured) return <SetupNotice />;

  const requirement = await prisma.requirement.findUnique({
    where: { id: reqId },
    select: {
      id: true,
      role: true,
      stack: true,
      openings: true,
      ctcMin: true,
      ctcMax: true,
      location: true,
      isRemote: true,
      urgency: true,
      status: true,
      notes: true,
      company: { select: { id: true, name: true } },
      intros: {
        select: {
          id: true,
          status: true,
          sentAt: true,
          candidate: {
            select: { id: true, tier: true, user: { select: { name: true } } },
          },
        },
        orderBy: { sentAt: "desc" },
      },
    },
  });

  if (!requirement) notFound();

  const alreadyIntroduced = new Set(
    requirement.intros.map((intro) => intro.candidate.id),
  );

  // Pool members not yet introduced for this requirement.
  const pool = await prisma.candidate.findMany({
    where: {
      inTalentPool: true,
      availability: { in: ["LOOKING", "OPEN"] },
      id: { notIn: [...alreadyIntroduced] },
    },
    select: {
      id: true,
      college: true,
      gradYear: true,
      skills: true,
      tier: true,
      adminNote: true,
      user: { select: { name: true } },
    },
    orderBy: [{ tier: "asc" }, { updatedAt: "desc" }],
    take: 60,
  });

  // Rank by stack overlap so the obvious matches float to the top.
  const wanted = requirement.stack.map((s) => s.toLowerCase());
  const scored = pool
    .map((candidate) => {
      const overlap = candidate.skills.filter((skill) =>
        wanted.includes(skill.toLowerCase()),
      );
      return { ...candidate, overlap };
    })
    .sort((a, b) => b.overlap.length - a.overlap.length);

  const suggested = scored.filter((candidate) => candidate.overlap.length > 0);
  const rest = scored.filter((candidate) => candidate.overlap.length === 0);

  return (
    <>
      <Link
        href="/admin/requirements"
        className="mono mb-6 inline-block text-eyebrow underline underline-offset-4"
      >
        ← All requirements
      </Link>

      <PageTitle
        title={requirement.role}
        sub={`${requirement.company.name} · ${requirement.openings} ${requirement.openings === 1 ? "opening" : "openings"} · ${formatCtcRange(requirement.ctcMin, requirement.ctcMax)}`}
        action={
          <StatusBadge tone="active">{humanizeEnum(requirement.status)}</StatusBadge>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[2fr_3fr]">
        <aside className="flex flex-col gap-6">
          <Block color="white" className="p-6">
            <p className="mono mb-3 text-eyebrow">The brief</p>
            <dl className="flex flex-col gap-3 text-[15px]">
              <div>
                <dt className="mono text-eyebrow text-ink-muted">Stack</dt>
                <dd className="mt-1">
                  <ul className="flex flex-wrap gap-1.5">
                    {requirement.stack.map((tech) => (
                      <li
                        key={tech}
                        className="mono border border-ink px-1.5 py-0.5 text-eyebrow"
                      >
                        {tech}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
              <div>
                <dt className="mono text-eyebrow text-ink-muted">Location</dt>
                <dd className="mt-1">
                  {requirement.isRemote
                    ? `${requirement.location} · remote ok`
                    : requirement.location}
                </dd>
              </div>
              <div>
                <dt className="mono text-eyebrow text-ink-muted">Urgency</dt>
                <dd className="mt-1">{humanizeEnum(requirement.urgency)}</dd>
              </div>
              {requirement.notes ? (
                <div>
                  <dt className="mono text-eyebrow text-ink-muted">Notes</dt>
                  <dd className="mt-1 text-ink-muted">{requirement.notes}</dd>
                </div>
              ) : null}
            </dl>
          </Block>

          <Block color="blue" className="p-6">
            <p className="mono mb-3 text-eyebrow">Already introduced</p>
            {requirement.intros.length === 0 ? (
              <p className="text-[15px] text-ink-muted">Nobody yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {requirement.intros.map((intro) => (
                  <li
                    key={intro.id}
                    className="flex items-center justify-between gap-3 border-b border-ink pb-3 last:border-b-0 last:pb-0"
                  >
                    <span className="text-[15px]">
                      {intro.candidate.user.name}
                      {intro.candidate.tier ? (
                        <span className="mono ml-2 text-eyebrow text-ink-muted">
                          Tier {intro.candidate.tier}
                        </span>
                      ) : null}
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge tone={introTone[intro.status] ?? "neutral"}>
                        {humanizeEnum(intro.status)}
                      </StatusBadge>
                      <span className="mono text-eyebrow text-ink-muted">
                        {formatDate(intro.sentAt)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Block>
        </aside>

        <section aria-labelledby="matching-title">
          <h2 id="matching-title" className="mono mb-4 text-label">
            Suggested matches
          </h2>

          {scored.length === 0 ? (
            <EmptyState
              title="No available candidates."
              body="Everyone in the pool has already been introduced for this requirement, or nobody is marked available."
            />
          ) : (
            <div className="flex flex-col gap-6">
              {suggested.length > 0 ? (
                <Block color="yellow" className="p-4">
                  <p className="mono text-eyebrow">
                    ✦ {suggested.length} candidate
                    {suggested.length === 1 ? "" : "s"} overlap this stack
                  </p>
                </Block>
              ) : null}

              <SendIntrosForm
                requirementId={requirement.id}
                candidates={[...suggested, ...rest].map((candidate) => ({
                  id: candidate.id,
                  name: `${candidate.user.name}${
                    candidate.overlap.length > 0
                      ? ` — matches ${candidate.overlap.join(", ")}`
                      : ""
                  }`,
                  tier: candidate.tier,
                  college: `${candidate.college} ${candidate.gradYear}`,
                }))}
              />
            </div>
          )}
        </section>
      </div>
    </>
  );
}
