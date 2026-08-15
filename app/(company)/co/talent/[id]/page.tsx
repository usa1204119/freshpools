import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma, isDbConfigured } from "@/lib/db";
import { getTalentProfile } from "@/lib/talent";
import { PageTitle, SetupNotice } from "@/components/app/shell";
import { Block } from "@/components/ui/block";
import { StatusBadge } from "@/components/ui/status-badge";
import { ShortlistButton, RequestIntroForm } from "@/components/forms/company-forms";
import { VideoEmbed } from "@/components/app/video-embed";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

export default async function TalentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!isDbConfigured || !session?.user) return <SetupNotice />;

  const candidate = await getTalentProfile(id);
  if (!candidate) notFound();

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const [saved, openRequirements, pendingRequest] = await Promise.all([
    company
      ? prisma.shortlistItem.findUnique({
          where: {
            companyId_candidateId: { companyId: company.id, candidateId: id },
          },
          select: { id: true },
        })
      : Promise.resolve(null),
    company
      ? prisma.requirement.findMany({
          where: { companyId: company.id, status: { notIn: ["CLOSED", "LOST"] } },
          select: { id: true, role: true },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    company
      ? prisma.introRequest.findFirst({
          where: { companyId: company.id, candidateId: id, status: "PENDING" },
          select: { id: true, createdAt: true },
        })
      : Promise.resolve(null),
  ]);

  const primary = candidate.history[0];

  return (
    <>
      <Link
        href="/co/talent"
        className="mono mb-6 inline-block text-eyebrow underline underline-offset-4"
      >
        ← Back to talent
      </Link>

      <PageTitle
        title={candidate.maskedName}
        sub={`${candidate.handle} · ${candidate.college} · Class of ${candidate.gradYear}`}
        action={
          candidate.tier ? <StatusBadge tone="done">Tier {candidate.tier}</StatusBadge> : null
        }
      />

      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-8">
          {/* Demo video first — it does more convincing than anything else. */}
          <section aria-labelledby="demo-title">
            <h2 id="demo-title" className="mono mb-4 text-label">
              Demo video
            </h2>
            {candidate.videoUrl ?? primary?.videoUrl ? (
              <VideoEmbed
                url={(candidate.videoUrl ?? primary?.videoUrl) as string}
                title={`${candidate.maskedName} — demo walkthrough`}
              />
            ) : (
              <Block color="white" className="p-6">
                <p className="text-[15px] text-ink-muted">
                  No demo video on file yet.
                </p>
              </Block>
            )}
          </section>

          <section aria-labelledby="history-title">
            <h2 id="history-title" className="mono mb-4 text-label">
              Event history
            </h2>
            {candidate.history.length === 0 ? (
              <Block color="white" className="p-6">
                <p className="text-[15px] text-ink-muted">
                  No scored events yet.
                </p>
              </Block>
            ) : (
              <ul className="flex flex-col gap-px border border-ink bg-ink">
                {candidate.history.map((entry, index) => (
                  <li key={`${entry.eventSlug}-${index}`} className="bg-block-white p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="mono text-eyebrow text-ink-muted">
                          {entry.eventTitle} · {formatDate(entry.eventDate)}
                        </p>
                        <p className="mt-2 font-sans text-[20px] font-bold tracking-[-0.02em]">
                          {entry.projectTitle}
                        </p>
                        <p className="mono mt-1 text-eyebrow text-ink-muted">
                          Team {entry.teamName}
                        </p>
                      </div>
                      {entry.rank ? (
                        <StatusBadge tone={entry.rank <= 10 ? "done" : "neutral"}>
                          Rank {entry.rank}
                        </StatusBadge>
                      ) : null}
                    </div>

                    <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
                      {entry.projectDescription}
                    </p>

                    <ul className="mt-4 flex flex-wrap gap-1.5">
                      {entry.stack.map((tech) => (
                        <li
                          key={tech}
                          className="mono border border-ink px-1.5 py-0.5 text-eyebrow"
                        >
                          {tech}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-4 flex flex-wrap gap-4 border-t border-ink pt-4">
                      {entry.repoUrl ? (
                        <a
                          href={entry.repoUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="mono text-eyebrow underline underline-offset-4"
                        >
                          Repository ↗
                        </a>
                      ) : null}
                      {entry.videoUrl ? (
                        <a
                          href={entry.videoUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="mono text-eyebrow underline underline-offset-4"
                        >
                          Demo ↗
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <Block color="blue" className="p-6">
            <p className="mono mb-4 text-eyebrow">Actions</p>
            <div className="flex flex-col gap-4">
              <ShortlistButton candidateId={candidate.id} saved={Boolean(saved)} />

              {pendingRequest ? (
                <div className="mono border border-ink bg-block-white px-4 py-3 text-label">
                  ✦ Introduction requested {formatDate(pendingRequest.createdAt)} — we&apos;re
                  asking the candidate.
                </div>
              ) : (
                <RequestIntroForm
                  candidateId={candidate.id}
                  requirements={openRequirements}
                />
              )}
            </div>
          </Block>

          <Block color="white" className="p-6">
            <p className="mono mb-4 text-eyebrow">Skills observed</p>
            <ul className="flex flex-wrap gap-1.5">
              {candidate.skills.map((skill) => (
                <li
                  key={skill}
                  className="mono border border-ink px-2 py-1 text-eyebrow"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </Block>

          <Block color="white" className="p-6">
            <p className="mono mb-4 text-eyebrow">Links</p>
            <ul className="flex flex-col gap-3">
              <li>
                <a
                  href={candidate.github}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-[15px] underline underline-offset-4"
                >
                  GitHub profile ↗
                </a>
              </li>
              {candidate.linkedin ? (
                <li>
                  <a
                    href={candidate.linkedin}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-[15px] underline underline-offset-4"
                  >
                    LinkedIn ↗
                  </a>
                </li>
              ) : null}
              {candidate.resumeUrl ? (
                <li>
                  <a
                    href={candidate.resumeUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-[15px] underline underline-offset-4"
                  >
                    Resume ↗
                  </a>
                </li>
              ) : null}
            </ul>
          </Block>

          {/* The rule, stated where it matters most. */}
          <Block color="coral" className="p-6">
            <p className="mono mb-3 text-eyebrow">Why there's no email here</p>
            <p className="text-[14px] leading-relaxed">
              Every introduction goes through us, with the candidate&apos;s
              consent. It protects them from spam and keeps the process
              accountable on both sides.
            </p>
          </Block>
        </aside>
      </div>
    </>
  );
}
