import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma, isDbConfigured } from "@/lib/db";
import { PageTitle, SetupNotice } from "@/components/app/shell";
import { Block } from "@/components/ui/block";
import { StatusBadge } from "@/components/ui/status-badge";
import { SubmissionForm } from "@/components/forms/submission-form";
import { LeaveTeamButton } from "@/components/forms/registration-forms";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Team", robots: { index: false } };

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!isDbConfigured || !session?.user) return <SetupNotice />;

  const candidate = await prisma.candidate.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!candidate) notFound();

  const team = await prisma.team.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      joinCode: true,
      leaderId: true,
      event: {
        select: {
          slug: true,
          title: true,
          endAt: true,
          minTeamSize: true,
          maxTeamSize: true,
        },
      },
      members: {
        select: {
          joinedAt: true,
          candidate: {
            select: { id: true, college: true, user: { select: { name: true } } },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      submission: {
        select: {
          id: true,
          title: true,
          description: true,
          repoUrl: true,
          videoUrl: true,
          stack: true,
          contributions: true,
          submittedAt: true,
        },
      },
    },
  });

  if (!team) notFound();

  // Membership check — a team id in the URL must not expose someone else's team.
  const isMember = team.members.some((m) => m.candidate.id === candidate.id);
  if (!isMember) notFound();

  const deadlinePassed = team.event.endAt.getTime() < Date.now();
  const locked = deadlinePassed || Boolean(team.submission?.submittedAt);
  const tooSmall = team.members.length < team.event.minTeamSize;

  return (
    <>
      <PageTitle
        title={team.name}
        sub={`${team.event.title} · submissions close ${formatDate(team.event.endAt, true)} IST`}
      />

      <div className="grid gap-8 lg:grid-cols-[2fr_3fr]">
        <aside className="flex flex-col gap-6">
          <Block color="blue" className="p-6">
            <p className="mono mb-3 text-eyebrow">Join code</p>
            <p className="mono border border-ink bg-block-white px-4 py-3 text-center text-[24px] tracking-[0.3em]">
              {team.joinCode}
            </p>
            <p className="mt-3 text-[14px]">
              Share this with anyone you want on the team. Teams are{" "}
              {team.event.minTeamSize}–{team.event.maxTeamSize} people.
            </p>
          </Block>

          <Block color="white" className="p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <p className="mono text-eyebrow">Members</p>
              <span className="mono text-eyebrow text-ink-muted">
                {team.members.length}/{team.event.maxTeamSize}
              </span>
            </div>
            <ul className="flex flex-col">
              {team.members.map((member) => (
                <li
                  key={member.candidate.id}
                  className="flex items-start justify-between gap-3 border-b border-ink py-3 last:border-b-0"
                >
                  <div>
                    <p className="text-[15px] font-medium">{member.candidate.user.name}</p>
                    <p className="mono text-eyebrow text-ink-muted">
                      {member.candidate.college}
                    </p>
                  </div>
                  {member.candidate.id === team.leaderId ? (
                    <StatusBadge tone="done">Lead</StatusBadge>
                  ) : null}
                </li>
              ))}
            </ul>

            {tooSmall ? (
              <p className="mono mt-4 border border-ink bg-block-coral px-3 py-2 text-eyebrow">
                ▲ Needs at least {team.event.minTeamSize} people
              </p>
            ) : null}

            {!locked ? (
              <div className="mt-5 border-t border-ink pt-4">
                <LeaveTeamButton teamId={team.id} eventSlug={team.event.slug} />
              </div>
            ) : null}
          </Block>
        </aside>

        <section aria-labelledby="submission-title">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2
              id="submission-title"
              className="font-sans text-[22px] font-bold tracking-[-0.02em]"
            >
              Submission
            </h2>
            {team.submission?.submittedAt ? (
              <StatusBadge tone="done">
                Submitted {formatDate(team.submission.submittedAt)}
              </StatusBadge>
            ) : deadlinePassed ? (
              <StatusBadge tone="attention">Window closed</StatusBadge>
            ) : (
              <StatusBadge tone="pending">Draft</StatusBadge>
            )}
          </div>

          <Block color="white" className="p-6 lg:p-8">
            <SubmissionForm
              teamId={team.id}
              locked={locked}
              defaults={{
                title: team.submission?.title,
                description: team.submission?.description,
                repoUrl: team.submission?.repoUrl,
                videoUrl: team.submission?.videoUrl,
                stack: team.submission?.stack,
                contributions: team.submission?.contributions,
              }}
            />
          </Block>

          <p className="mt-5 text-[14px] text-ink-muted">
            Judging is {""}
            <Link
              href={`/hackathons/${team.event.slug}#judging-title`}
              className="underline underline-offset-4"
            >
              scored per person
            </Link>
            , not per team — which is why the contributions breakdown matters.
          </p>
        </section>
      </div>
    </>
  );
}
