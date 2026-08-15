import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma, isDbConfigured } from "@/lib/db";
import {
  PageTitle,
  StatRow,
  StatTile,
  EmptyState,
  SetupNotice,
} from "@/components/app/shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { Block } from "@/components/ui/block";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default async function CandidateDashboard() {
  const session = await auth();
  if (!isDbConfigured || !session?.user) return <SetupNotice />;

  const candidate = await prisma.candidate.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      tier: true,
      inTalentPool: true,
      videoUrl: true,
      resumeUrl: true,
      skills: true,
      availability: true,
      _count: { select: { registrations: true, intros: true } },
    },
  });

  if (!candidate) {
    return (
      <>
        <PageTitle title="Dashboard" />
        <EmptyState
          title="Finish setting up your profile."
          body="We need a few details before you can register for anything."
          action={<ButtonLink href="/onboarding">Complete setup</ButtonLink>}
        />
      </>
    );
  }

  const [nextRegistration, openEvents] = await Promise.all([
    prisma.registration.findFirst({
      where: {
        candidateId: candidate.id,
        event: { status: { in: ["REGISTRATION_OPEN", "ANNOUNCED", "LIVE"] } },
      },
      orderBy: { event: { startAt: "asc" } },
      select: {
        id: true,
        paymentStatus: true,
        teamId: true,
        event: { select: { title: true, slug: true, startAt: true } },
      },
    }),
    prisma.event.count({ where: { status: "REGISTRATION_OPEN" } }),
  ]);

  // Profile completeness drives the one nudge we show — everything on this
  // list is something a company actually looks at.
  const checklist = [
    { label: "Skills listed", done: candidate.skills.length > 0, href: "/me/profile" },
    { label: "Demo video added", done: Boolean(candidate.videoUrl), href: "/me/profile" },
    { label: "Resume linked", done: Boolean(candidate.resumeUrl), href: "/me/profile" },
    {
      label: "Completed an event",
      done: candidate._count.registrations > 0,
      href: "/hackathons",
    },
  ];
  const remaining = checklist.filter((item) => !item.done);

  return (
    <>
      <PageTitle
        title="Dashboard"
        sub="Everything a company eventually sees starts here."
        action={<ButtonLink href="/hackathons" size="sm">Find an event</ButtonLink>}
      />

      <StatRow>
        <StatTile
          label="Events registered"
          value={candidate._count.registrations}
          tone="blue"
        />
        <StatTile
          label="Introductions"
          value={candidate._count.intros}
          note="Companies we've introduced you to"
        />
        <StatTile
          label="Verification tier"
          value={candidate.tier ?? "—"}
          note={candidate.tier ? "Assigned after review" : "Complete an event to get rated"}
          tone={candidate.tier ? "yellow" : "white"}
        />
        <StatTile
          label="Talent pool"
          value={candidate.inTalentPool ? "Listed" : "Not yet"}
          tone={candidate.inTalentPool ? "ink" : "white"}
        />
      </StatRow>

      <div className="mt-10 grid gap-8 lg:grid-cols-[3fr_2fr]">
        <section aria-labelledby="next-up">
          <h2 id="next-up" className="mono mb-4 text-label">
            Next up
          </h2>
          {nextRegistration ? (
            <Block color="white" className="p-6">
              <p className="mono text-eyebrow text-ink-muted">
                {formatDate(nextRegistration.event.startAt, true)}
              </p>
              <p className="mt-2 font-sans text-[24px] font-bold tracking-[-0.02em]">
                {nextRegistration.event.title}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {nextRegistration.paymentStatus === "PENDING" ? (
                  <StatusBadge tone="pending">Payment pending</StatusBadge>
                ) : null}
                {nextRegistration.paymentStatus === "FAILED" ? (
                  <StatusBadge tone="attention">Payment failed</StatusBadge>
                ) : null}
                {!nextRegistration.teamId ? (
                  <StatusBadge tone="attention">No team yet</StatusBadge>
                ) : null}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href="/me/hackathons" size="sm">
                  Manage registration
                </ButtonLink>
                <ButtonLink
                  href={`/hackathons/${nextRegistration.event.slug}`}
                  size="sm"
                  variant="secondary"
                >
                  Event page
                </ButtonLink>
              </div>
            </Block>
          ) : (
            <EmptyState
              title="You're not registered for anything yet."
              body={
                openEvents > 0
                  ? `There ${openEvents === 1 ? "is" : "are"} ${openEvents} event${openEvents === 1 ? "" : "s"} open for registration right now.`
                  : "Nothing is open right now. We'll list the next one as soon as dates are locked."
              }
              action={
                openEvents > 0 ? (
                  <ButtonLink href="/hackathons" size="sm">
                    Browse events
                  </ButtonLink>
                ) : undefined
              }
            />
          )}
        </section>

        <section aria-labelledby="profile-strength">
          <h2 id="profile-strength" className="mono mb-4 text-label">
            Profile strength
          </h2>
          <Block color={remaining.length === 0 ? "yellow" : "white"} className="p-6">
            <ul className="flex flex-col gap-3">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-3 text-[15px]">
                    <span
                      aria-hidden="true"
                      className={
                        item.done
                          ? "flex size-5 items-center justify-center border border-ink bg-ink text-[11px] text-white"
                          : "flex size-5 items-center justify-center border border-ink"
                      }
                    >
                      {item.done ? "✓" : ""}
                    </span>
                    <span className={item.done ? "text-ink-muted line-through" : ""}>
                      {item.label}
                    </span>
                  </span>
                  {!item.done ? (
                    <Link
                      href={item.href}
                      className="mono text-eyebrow underline underline-offset-4"
                    >
                      Fix
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
            {remaining.length === 0 ? (
              <p className="mt-5 border-t border-ink pt-4 text-[14px]">
                Complete. The demo video is the part that convinces people.
              </p>
            ) : null}
          </Block>
        </section>
      </div>
    </>
  );
}
