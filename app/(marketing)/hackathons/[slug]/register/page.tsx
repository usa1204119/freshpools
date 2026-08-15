import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma, isDbConfigured } from "@/lib/db";
import { Eyebrow, MixedHeadline } from "@/components/marketing/mixed-headline";
import { FeeDisplay, StudentsNeverPayNote } from "@/components/marketing/fee-display";
import { Block } from "@/components/ui/block";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge, paymentTone, humanizeEnum } from "@/components/ui/status-badge";
import {
  RegistrationDetailsForm,
  TeamForms,
  LeaveTeamButton,
} from "@/components/forms/registration-forms";
import { RazorpayCheckout } from "@/components/forms/razorpay-checkout";
import { razorpayConfigured } from "@/lib/razorpay";
import { cn, formatPaise } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Register",
  robots: { index: false, follow: false },
};

const STEPS = ["Your details", "Team", "Payment", "Done"] as const;

function StepRail({ current }: { current: number }) {
  return (
    <ol className="mb-10 grid grid-cols-4 gap-px overflow-hidden rounded-lg border border-line-soft bg-line-soft">
      {STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li
            key={label}
            aria-current={active ? "step" : undefined}
            className={cn(
              "p-3 text-center sm:p-4",
              active ? "bg-block-yellow" : done ? "bg-block-blue" : "bg-block-white",
            )}
          >
            <p className="mono text-eyebrow text-ink-muted">
              {done ? "✓" : String(index + 1).padStart(2, "0")}
            </p>
            <p className="mt-1 text-[13px] leading-tight font-medium sm:text-[15px]">
              {label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!isDbConfigured) {
    return (
      <div className="container-x section-y">
        <Block color="white" className="max-w-2xl p-10">
          <p className="mono mb-4 text-eyebrow">Not available</p>
          <p className="text-body-lg">
            Registration needs a database connection. Set <code>DATABASE_URL</code>{" "}
            and run <code>npm run db:push</code>.
          </p>
        </Block>
      </div>
    );
  }

  const event = await prisma.event.findFirst({
    where: { slug, status: { not: "DRAFT" } },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      deadline: true,
      minTeamSize: true,
      maxTeamSize: true,
      registrationFee: true,
      depositAmount: true,
      isSponsoredFree: true,
      sponsor: { select: { name: true } },
    },
  });
  if (!event) notFound();

  const session = await auth();

  // Not signed in → signup with role pre-set, and come straight back here.
  if (!session?.user) {
    redirect(`/signup?role=student&next=/hackathons/${slug}/register`);
  }
  if (session.user.role !== "CANDIDATE") {
    return (
      <div className="container-x section-y">
        <Block color="coral" className="max-w-2xl p-10">
          <p className="mono mb-4 text-eyebrow">Wrong account type</p>
          <p className="text-body-lg">
            You&apos;re signed in with a{" "}
            {session.user.role === "COMPANY" ? "company" : "staff"} account. Event
            registration is for candidate accounts.
          </p>
        </Block>
      </div>
    );
  }

  const candidate = await prisma.candidate.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      college: true,
      gradYear: true,
      github: true,
      skills: true,
      user: { select: { phone: true } },
    },
  });

  const registration = candidate
    ? await prisma.registration.findUnique({
        where: {
          eventId_candidateId: { eventId: event.id, candidateId: candidate.id },
        },
        select: {
          id: true,
          paymentStatus: true,
          amountPaid: true,
          teamId: true,
          team: {
            select: {
              id: true,
              name: true,
              joinCode: true,
              leaderId: true,
              members: {
                select: {
                  candidate: {
                    select: { id: true, user: { select: { name: true } } },
                  },
                },
              },
            },
          },
        },
      })
    : null;

  const deadlinePassed = event.deadline.getTime() < Date.now();
  const registrationOpen = event.status === "REGISTRATION_OPEN" && !deadlinePassed;

  const needsPayment =
    registration !== null &&
    !event.isSponsoredFree &&
    registration.paymentStatus !== "PAID" &&
    registration.paymentStatus !== "WAIVED";

  const isComplete =
    registration !== null &&
    (registration.paymentStatus === "PAID" || registration.paymentStatus === "WAIVED");

  const step = !registration ? 0 : !registration.teamId ? 1 : needsPayment ? 2 : 3;

  if (!registrationOpen && !registration) {
    return (
      <div className="container-x section-y">
        <Block color="white" className="max-w-2xl p-10">
          <p className="mono mb-4 text-eyebrow">Registration closed</p>
          <p className="text-body-lg text-ink-muted">
            Registration for {event.title} is no longer open.
          </p>
          <div className="mt-8">
            <ButtonLink href="/hackathons" variant="secondary">
              See other events
            </ButtonLink>
          </div>
        </Block>
      </div>
    );
  }

  return (
    <>
      <section className="border-b border-line-soft wash-soft">
        <div className="container-x py-12 lg:py-16">
          <Eyebrow className="mb-4">Register</Eyebrow>
          <MixedHeadline
            text={`**${event.title}**`}
            as="h1"
            size="h3"
            className="max-w-[20ch]"
          />
          <div className="mt-6 max-w-xl">
            <FeeDisplay
              registrationFee={event.registrationFee}
              depositAmount={event.depositAmount}
              isSponsoredFree={event.isSponsoredFree}
              sponsorName={event.sponsor?.name}
            />
          </div>
          <Link
            href={`/hackathons/${slug}`}
            className="mono mt-6 inline-block text-eyebrow underline underline-offset-4"
          >
            ← Event details
          </Link>
        </div>
      </section>

      <section className="section-y bg-paper">
        <div className="container-x max-w-4xl">
          <StepRail current={step} />

          {/* ── Step 1: details ──────────────────────────────────────────── */}
          {!registration ? (
            <Block color="white" className="p-6 lg:p-10">
              <h2 className="mb-6 font-sans text-[24px] font-bold tracking-[-0.02em]">
                Your details
              </h2>
              <RegistrationDetailsForm
                eventSlug={slug}
                defaults={{
                  college: candidate?.college,
                  gradYear: candidate?.gradYear,
                  phone: candidate?.user.phone ?? undefined,
                  github: candidate?.github,
                  skills: candidate?.skills,
                }}
              />
            </Block>
          ) : null}

          {/* ── Step 2: team ─────────────────────────────────────────────── */}
          {registration && !registration.team ? (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-sans text-[24px] font-bold tracking-[-0.02em]">
                  Form your team
                </h2>
                <p className="mt-2 text-[15px] text-ink-muted">
                  Teams are {event.minTeamSize}–{event.maxTeamSize} people. You can
                  sort this out later, but you must be in a team before the
                  submission deadline.
                </p>
              </div>
              <TeamForms eventSlug={slug} />
              {needsPayment ? (
                <p className="mono text-eyebrow text-ink-muted">
                  Payment comes next — you can also{" "}
                  <Link href="/me/hackathons" className="underline underline-offset-4">
                    handle both from your dashboard
                  </Link>
                  .
                </p>
              ) : null}
            </div>
          ) : null}

          {/* ── Team summary once they're in one ─────────────────────────── */}
          {registration?.team ? (
            <Block color="blue" className="mb-8 p-6 lg:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="mono text-eyebrow text-ink-muted">Your team</p>
                  <p className="mt-2 font-sans text-[24px] font-bold tracking-[-0.02em]">
                    {registration.team.name}
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {registration.team.members.map((member) => (
                      <li
                        key={member.candidate.id}
                        className="mono rounded-sm border border-line-mid px-2 py-1 text-eyebrow"
                      >
                        {member.candidate.user.name}
                        {member.candidate.id === registration.team?.leaderId
                          ? " · lead"
                          : ""}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-right">
                  <p className="mono text-eyebrow text-ink-muted">Join code</p>
                  <p className="mono mt-2 rounded-md border border-line-mid bg-block-white px-3 py-2 text-[20px] tracking-[0.25em]">
                    {registration.team.joinCode}
                  </p>
                </div>
              </div>
              <div className="mt-5 border-t border-line-soft pt-4">
                <LeaveTeamButton teamId={registration.team.id} eventSlug={slug} />
              </div>
            </Block>
          ) : null}

          {/* ── Step 3: payment ──────────────────────────────────────────── */}
          {registration && needsPayment ? (
            <Block color="white" className="p-6 lg:p-10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="font-sans text-[24px] font-bold tracking-[-0.02em]">
                  Entry fee
                </h2>
                <StatusBadge tone={paymentTone[registration.paymentStatus] ?? "pending"}>
                  {humanizeEnum(registration.paymentStatus)}
                </StatusBadge>
              </div>

              {registration.paymentStatus === "FAILED" ? (
                <p className="mono mt-4 rounded-md border border-ink bg-block-coral px-4 py-3 text-label">
                  ▲ That payment didn&apos;t go through. Your registration is
                  saved — retry below.
                </p>
              ) : null}

              <p className="mt-4 text-[15px] text-ink-muted">
                {formatPaise(event.registrationFee)} now,{" "}
                {formatPaise(event.depositAmount)} back after you check in at the
                event. This covers logistics only.
              </p>

              <div className="mt-6">
                {razorpayConfigured ? (
                  <RazorpayCheckout
                    registrationId={registration.id}
                    amount={event.registrationFee}
                    label={
                      registration.paymentStatus === "FAILED" ? "Retry payment" : "Pay"
                    }
                  />
                ) : (
                  <p className="mono rounded-md border border-ink bg-block-yellow px-4 py-3 text-label">
                    ✦ Payments are not configured on this deployment. Set the
                    RAZORPAY_* environment variables.
                  </p>
                )}
              </div>

              <div className="mt-8">
                <StudentsNeverPayNote variant="line" />
              </div>
            </Block>
          ) : null}

          {/* ── Step 4: done ─────────────────────────────────────────────── */}
          {isComplete ? (
            <Block color="yellow" className="p-6 lg:p-10">
              <p className="mono text-eyebrow">✦ You&apos;re registered</p>
              <h2 className="mt-4 font-sans text-[30px] leading-tight font-bold tracking-[-0.02em]">
                {event.isSponsoredFree || registration.paymentStatus === "WAIVED"
                  ? "Entry confirmed — nothing to pay."
                  : "Payment received."}
              </h2>
              <p className="mt-4 max-w-2xl text-[16px]">
                {registration.paymentStatus === "PAID"
                  ? `You paid ${formatPaise(registration.amountPaid)}. ${formatPaise(event.depositAmount)} comes back once an organiser verifies your check-in at the event.`
                  : "This event is sponsored, so entry is free. There is nothing to pay and nothing to claim back."}
              </p>
              <p className="mt-3 text-[15px] text-ink-muted">
                A confirmation email is on its way.
                {!registration.teamId
                  ? " You still need to join or create a team before the submission deadline."
                  : ""}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <ButtonLink href="/me/hackathons">Go to my dashboard</ButtonLink>
                <ButtonLink href={`/hackathons/${slug}`} variant="secondary">
                  Back to the event
                </ButtonLink>
              </div>
            </Block>
          ) : null}
        </div>
      </section>
    </>
  );
}
