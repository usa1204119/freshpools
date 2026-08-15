import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Eyebrow, MixedHeadline } from "@/components/marketing/mixed-headline";
import { FeeDisplay, StudentsNeverPayNote } from "@/components/marketing/fee-display";
import { Countdown } from "@/components/marketing/countdown";
import { StickyRegister } from "@/components/marketing/sticky-register";
import { Faq } from "@/components/marketing/faq";
import { Reveal } from "@/components/marketing/reveal";
import { Block, blockAt } from "@/components/ui/block";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge, eventTone, humanizeEnum } from "@/components/ui/status-badge";
import { getEventBySlug } from "@/lib/queries";
import {
  DEFAULT_RULES,
  EVENT_FAQ,
  EVENT_TIMELINE,
  JUDGING_CRITERIA,
  NON_WINNER_BENEFITS,
} from "@/lib/content";
import { formatDate, formatDateRange, formatPaise } from "@/lib/utils";

/**
 * Rendered per request, not ISR. The marketing layout reads the session to
 * decide between "Sign in" and "Dashboard" in the nav, so this route touches
 * cookies and can never be statically prerendered — declaring `revalidate`
 * here made unknown slugs throw DYNAMIC_SERVER_USAGE instead of 404-ing.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event not found" };

  return {
    title: event.title,
    description:
      event.tagline ?? event.problemStatement.slice(0, 155).replace(/\s+\S*$/, "…"),
    openGraph: {
      title: `${event.title} — FreshPools`,
      description: event.tagline ?? undefined,
      type: "article",
    },
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const deadlinePassed = new Date(event.deadline).getTime() < Date.now();
  const canRegister = event.status === "REGISTRATION_OPEN" && !deadlinePassed;
  const rules = event.rules.length > 0 ? event.rules : [...DEFAULT_RULES];
  const sponsorName = event.sponsor?.name ?? null;

  const registrationClosedLabel =
    event.status === "COMPLETED"
      ? "Event complete"
      : event.status === "ANNOUNCED"
        ? "Registration opens soon"
        : "Registration closed";

  const facts = [
    { label: "Dates", value: formatDateRange(event.startAt, event.endAt) },
    {
      label: "Mode",
      value:
        event.mode === "ONLINE"
          ? "Online"
          : [event.venue, event.college?.name, event.city]
              .filter(Boolean)
              .join(" · ") || "Offline",
    },
    {
      label: "Prize pool",
      value: event.prizePool ? formatPaise(event.prizePool) : "To be announced",
    },
    {
      label: "Team size",
      value: `${event.minTeamSize}–${event.maxTeamSize} people`,
    },
  ];

  return (
    <>
      {/* ── 1. Hero ────────────────────────────────────────────────────────── */}
      <section className="border-b border-ink bg-sky">
        <div className="container-x py-16 lg:py-24">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge tone={eventTone[event.status] ?? "neutral"}>
              {humanizeEnum(event.status)}
            </StatusBadge>
            {sponsorName ? (
              <p className="mono text-eyebrow text-ink-muted">
                Presented by {sponsorName}
              </p>
            ) : null}
            {event.college ? (
              <p className="mono text-eyebrow text-ink-muted">
                Hosted at {event.college.name}
              </p>
            ) : null}
          </div>

          <MixedHeadline
            text={`**${event.title}**`}
            as="h1"
            size="h1"
            className="mt-6 max-w-[18ch]"
          />

          {event.tagline ? (
            <p className="hl-serif mt-6 max-w-2xl text-[24px] text-ink-muted lg:text-[28px]">
              {event.tagline}
            </p>
          ) : null}

          <dl className="mt-12 grid gap-px border border-ink bg-ink sm:grid-cols-2 lg:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.label} className="bg-block-white p-5">
                <dt className="mono text-eyebrow text-ink-muted">{fact.label}</dt>
                <dd className="mt-2 text-[16px] leading-snug font-medium">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>

          {/* ── 2. Fee banner ────────────────────────────────────────────── */}
          <div className="mt-8 max-w-2xl">
            <FeeDisplay
              variant="banner"
              registrationFee={event.registrationFee}
              depositAmount={event.depositAmount}
              isSponsoredFree={event.isSponsoredFree}
              sponsorName={sponsorName}
            />
          </div>

          {/* ── 3. Countdown ─────────────────────────────────────────────── */}
          {canRegister ? (
            <div className="mt-8">
              <Countdown deadline={event.deadline} />
            </div>
          ) : null}

          <div id="register-anchor" className="mt-10 flex flex-wrap items-center gap-4">
            {canRegister ? (
              <ButtonLink href={`/hackathons/${slug}/register`} size="lg">
                Register
              </ButtonLink>
            ) : (
              <p className="mono border border-ink bg-paper px-6 py-4 text-label">
                {registrationClosedLabel}
              </p>
            )}
            {event.status === "COMPLETED" ? (
              <ButtonLink
                href={`/hackathons/${slug}/leaderboard`}
                variant="secondary"
                size="lg"
              >
                See results
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── 4. Problem statement ───────────────────────────────────────────── */}
      <section className="section-y bg-paper" aria-labelledby="problem-title">
        <div className="container-x grid gap-10 lg:grid-cols-[2fr_3fr] lg:gap-16">
          <div className="flex flex-col gap-6">
            <Eyebrow>The problem</Eyebrow>
            <MixedHeadline
              id="problem-title"
              text="What you'll **build.**"
              as="h2"
              size="h2"
            />
            {sponsorName ? (
              <p className="mono text-label text-ink-muted">
                Presented by {sponsorName}
              </p>
            ) : null}
          </div>
          <div className="max-w-prose text-body-lg whitespace-pre-line text-ink-muted">
            {event.problemStatement}
          </div>
        </div>
      </section>

      {/* ── 5. Tracks ──────────────────────────────────────────────────────── */}
      {event.tracks.length > 0 ? (
        <section className="section-y border-t border-ink bg-sky" aria-labelledby="tracks-title">
          <div className="container-x">
            <Eyebrow className="mb-6">Tracks</Eyebrow>
            <MixedHeadline
              id="tracks-title"
              text="Pick **one lane.**"
              as="h2"
              size="h2"
              className="mb-10"
            />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {event.tracks.map((track, index) => (
                <Block key={track} as="li" color={blockAt(index)} className="p-8">
                  <p className="mono text-eyebrow text-ink-muted">
                    Track {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-3 font-sans text-[22px] font-bold tracking-[-0.02em]">
                    {track}
                  </p>
                </Block>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ── 6. Timeline ────────────────────────────────────────────────────── */}
      <section className="section-y border-t border-ink bg-paper" aria-labelledby="timeline-title">
        <div className="container-x">
          <Eyebrow className="mb-6">Timeline</Eyebrow>
          <MixedHeadline
            id="timeline-title"
            text="How the weekend **runs.**"
            as="h2"
            size="h2"
            className="mb-12"
          />
          <ol className="grid gap-px border border-ink bg-ink sm:grid-cols-2 lg:grid-cols-6">
            {EVENT_TIMELINE.map((step, index) => (
              <li key={step.label} className="bg-block-white p-5">
                <span className="mono text-eyebrow text-ink-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-3 font-sans text-[17px] leading-tight font-bold">
                  {step.label}
                </p>
                <p className="mt-2 text-[13px] leading-snug text-ink-muted">
                  {step.note}
                </p>
              </li>
            ))}
          </ol>
          <p className="mono mt-6 text-eyebrow text-ink-muted">
            Registration closes {formatDate(event.deadline, true)} IST · Kickoff{" "}
            {formatDate(event.startAt, true)} IST
          </p>
        </div>
      </section>

      {/* ── 7. Prizes ──────────────────────────────────────────────────────── */}
      {event.prizes.length > 0 ? (
        <section className="section-y border-t border-ink bg-sky" aria-labelledby="prizes-title">
          <div className="container-x">
            <Eyebrow className="mb-6">Prizes</Eyebrow>
            <MixedHeadline
              id="prizes-title"
              text="What's on **the table.**"
              as="h2"
              size="h2"
              className="mb-10"
            />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {event.prizes.map((prize, index) => (
                <Block key={prize.id} as="li" color={blockAt(index)} className="h-full p-8">
                  <p className="mono text-eyebrow text-ink-muted">{prize.rank}</p>
                  {prize.amount ? (
                    <p className="mt-3 font-sans text-[36px] leading-none font-bold tracking-[-0.03em]">
                      {formatPaise(prize.amount)}
                    </p>
                  ) : null}
                  {prize.perk ? (
                    <p className="mt-3 text-[15px] text-ink-muted">{prize.perk}</p>
                  ) : null}
                </Block>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ── 8. What you get even if you don't win ─────────────────────────── */}
      <section className="section-y border-t border-ink bg-paper" aria-labelledby="benefits-title">
        <div className="container-x">
          <Eyebrow className="mb-6">Even if you don&apos;t win</Eyebrow>
          <MixedHeadline
            id="benefits-title"
            text="Most people **don't win.** They still leave with this."
            as="h2"
            size="h2"
            className="mb-12 max-w-[20ch]"
          />
          <div className="grid gap-px border border-ink bg-ink lg:grid-cols-3">
            {NON_WINNER_BENEFITS.map((benefit, index) => (
              <Reveal key={benefit.heading} delay={index * 0.06}>
                <Block color={blockAt(index)} className="h-full border-0 p-8">
                  <h3 className="font-sans text-[24px] leading-tight font-bold tracking-[-0.02em]">
                    {benefit.heading}
                  </h3>
                  <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
                    {benefit.body}
                  </p>
                </Block>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. Judging criteria — public on purpose ───────────────────────── */}
      <section className="section-y border-t border-ink bg-sky" aria-labelledby="judging-title">
        <div className="container-x grid gap-10 lg:grid-cols-[2fr_3fr] lg:gap-16">
          <div className="flex flex-col gap-6">
            <Eyebrow>Judging</Eyebrow>
            <MixedHeadline
              id="judging-title"
              text="The rubric is **public.**"
              as="h2"
              size="h2"
            />
            <p className="max-w-md text-body-lg text-ink-muted">
              You should know exactly what you are being marked on before you
              write a line of code. Scoring is per person, not per team.
            </p>
          </div>
          <ul className="border border-ink bg-block-white">
            {JUDGING_CRITERIA.map((criterion) => (
              <li
                key={criterion.label}
                className="flex flex-col gap-3 border-b border-ink p-6 last:border-b-0"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <p className="font-sans text-[18px] font-medium">{criterion.label}</p>
                  <p className="mono text-label">{criterion.weight}%</p>
                </div>
                <div className="h-2 border border-ink" aria-hidden="true">
                  <div className="h-full bg-ink" style={{ width: `${criterion.weight}%` }} />
                </div>
                <p className="text-[14px] text-ink-muted">{criterion.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 10. Rules ──────────────────────────────────────────────────────── */}
      <section className="section-y border-t border-ink bg-paper" aria-labelledby="rules-title">
        <div className="container-x grid gap-10 lg:grid-cols-[2fr_3fr] lg:gap-16">
          <div className="flex flex-col gap-6">
            <Eyebrow>Rules</Eyebrow>
            <MixedHeadline id="rules-title" text="Short **list.**" as="h2" size="h2" />
          </div>
          <ul className="border-t border-ink">
            {rules.map((rule) => (
              <li
                key={rule}
                className="flex gap-4 border-b border-ink py-5 text-[16px] leading-relaxed"
              >
                <span aria-hidden="true" className="mono text-ink-muted">
                  ✦
                </span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 11. Fee & refund policy ────────────────────────────────────────── */}
      <section id="fees" className="section-y border-t border-ink bg-sky" aria-labelledby="fees-title">
        <div className="container-x">
          <Eyebrow className="mb-6">Fees &amp; refunds</Eyebrow>
          <MixedHeadline
            id="fees-title"
            text="Where your **money goes.**"
            as="h2"
            size="h2"
            className="mb-10 max-w-[16ch]"
          />

          <div className="grid gap-8 lg:grid-cols-2">
            <Block color="white" className="p-8">
              {event.isSponsoredFree ? (
                <>
                  <p className="mono mb-4 text-eyebrow">Entry</p>
                  <p className="text-body-lg">
                    Entry to this event is <strong>free</strong>
                    {sponsorName ? `, sponsored by ${sponsorName}` : ""}. There is
                    nothing to pay and nothing to claim back.
                  </p>
                </>
              ) : (
                <>
                  <p className="mono mb-4 text-eyebrow">Entry</p>
                  <p className="text-body-lg">
                    <strong>{formatPaise(event.registrationFee)} entry.</strong>{" "}
                    {formatPaise(event.depositAmount)} of that is refunded to you
                    when you attend and check in. It covers logistics only —
                    venue, internet, food and the prize pool.
                  </p>
                  <p className="mt-4 text-[15px] text-ink-muted">
                    Refunds are triggered by an organiser after check-in is
                    verified, and reach your original payment method in about 5–7
                    working days.
                  </p>
                </>
              )}
            </Block>

            <StudentsNeverPayNote />
          </div>
        </div>
      </section>

      {/* ── 12. FAQ ────────────────────────────────────────────────────────── */}
      <Faq
        items={EVENT_FAQ}
        eyebrow="Event questions"
        headline="Before you **register.**"
      />

      {/* ── 13. Register CTA repeat ────────────────────────────────────────── */}
      <section className="border-t border-ink bg-block-ink text-white">
        <div className="container-x flex flex-col items-start gap-8 py-20 lg:flex-row lg:items-center lg:justify-between">
          <MixedHeadline
            text={canRegister ? "Ready? **Take the slot.**" : "Missed this one?"}
            as="h2"
            size="h2"
            className="max-w-[16ch] text-white"
          />
          <div className="flex shrink-0 flex-col gap-4">
            {canRegister ? (
              <>
                <ButtonLink
                  href={`/hackathons/${slug}/register`}
                  variant="inverse"
                  size="lg"
                >
                  Register
                </ButtonLink>
                <p className="mono text-eyebrow text-white/70">
                  {event.isSponsoredFree
                    ? "Entry free · sponsored"
                    : `${formatPaise(event.registrationFee)} · ${formatPaise(event.depositAmount)} refundable`}
                </p>
              </>
            ) : (
              <Link
                href="/hackathons"
                className="mono border border-white px-6 py-4 text-label hover:bg-white hover:text-ink"
              >
                See upcoming events →
              </Link>
            )}
          </div>
        </div>
      </section>

      <StickyRegister
        slug={slug}
        registrationFee={event.registrationFee}
        isSponsoredFree={event.isSponsoredFree}
        disabled={!canRegister}
        disabledLabel={registrationClosedLabel}
      />
    </>
  );
}
