import Link from "next/link";
import { Block, type BlockColor } from "@/components/ui/block";
import { StatusBadge, eventTone, humanizeEnum } from "@/components/ui/status-badge";
import { FeeDisplay } from "./fee-display";
import { Countdown } from "./countdown";
import { ButtonLink } from "@/components/ui/button";
import { formatDateRange, formatPaise } from "@/lib/utils";
import type { EventCardData } from "@/lib/queries";

function locationLine(event: EventCardData): string {
  if (event.mode === "ONLINE") return "Online";
  const parts = [event.venue, event.college?.name, event.city].filter(Boolean);
  return parts.length > 0 ? `Offline · ${parts.join(" · ")}` : "Offline";
}

export function UpcomingEventCard({
  event,
  color = "white",
}: {
  event: EventCardData;
  color?: BlockColor;
}) {
  const registrationOpen = event.status === "REGISTRATION_OPEN";
  const deadlinePassed = new Date(event.deadline).getTime() < Date.now();

  return (
    <Block
      as="article"
      color={color}
      className="flex h-full flex-col gap-6 p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <StatusBadge tone={eventTone[event.status] ?? "neutral"}>
          {humanizeEnum(event.status)}
        </StatusBadge>
        <p className="mono text-eyebrow text-ink-muted">
          {formatDateRange(event.startAt, event.endAt)}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-sans text-[26px] leading-tight font-bold tracking-[-0.02em] lg:text-[30px]">
          <Link href={`/hackathons/${event.slug}`} className="hover:underline">
            {event.title}
          </Link>
        </h3>
        {event.tagline ? (
          <p className="hl-serif text-[18px] text-ink-muted">{event.tagline}</p>
        ) : null}
      </div>

      <dl className="grid grid-cols-2 gap-px border border-ink bg-ink text-ink">
        <div className="bg-block-white p-3">
          <dt className="mono text-eyebrow text-ink-muted">Where</dt>
          <dd className="mt-1 text-[14px] leading-snug">{locationLine(event)}</dd>
        </div>
        <div className="bg-block-white p-3">
          <dt className="mono text-eyebrow text-ink-muted">Prize pool</dt>
          <dd className="mt-1 text-[14px] leading-snug">
            {event.prizePool ? formatPaise(event.prizePool) : "To be announced"}
          </dd>
        </div>
      </dl>

      <FeeDisplay
        registrationFee={event.registrationFee}
        depositAmount={event.depositAmount}
        isSponsoredFree={event.isSponsoredFree}
        sponsorName={event.sponsor?.name}
      />

      {registrationOpen && !deadlinePassed ? (
        <Countdown deadline={event.deadline} label="Registration closes in" />
      ) : null}

      <div className="mt-auto flex flex-wrap gap-3 pt-2">
        {registrationOpen && !deadlinePassed ? (
          <ButtonLink href={`/hackathons/${event.slug}/register`} size="sm">
            Register
          </ButtonLink>
        ) : null}
        <ButtonLink
          href={`/hackathons/${event.slug}`}
          size="sm"
          variant="secondary"
        >
          Details
        </ButtonLink>
      </div>
    </Block>
  );
}

export function PastEventCard({
  event,
  color = "white",
}: {
  event: EventCardData;
  color?: BlockColor;
}) {
  const participants = event._count.registrations;

  return (
    <Block
      as="article"
      color={color}
      className="flex h-full flex-col gap-4 p-8"
    >
      <p className="mono text-eyebrow text-ink-muted">
        {formatDateRange(event.startAt, event.endAt)}
      </p>
      <h3 className="font-sans text-[24px] leading-tight font-bold tracking-[-0.02em]">
        <Link href={`/hackathons/${event.slug}`} className="hover:underline">
          {event.title}
        </Link>
      </h3>
      <p className="text-[15px] text-ink-muted">{locationLine(event)}</p>

      {participants > 0 ? (
        <p className="mono text-label">
          {participants} {participants === 1 ? "participant" : "participants"}
        </p>
      ) : null}

      <Link
        href={`/hackathons/${event.slug}/leaderboard`}
        className="mono group/link mt-auto inline-flex items-center gap-2 pt-2 text-label underline underline-offset-4"
      >
        View results
        <span
          aria-hidden="true"
          className="transition-transform duration-200 group-hover/link:translate-x-1"
        >
          →
        </span>
      </Link>
    </Block>
  );
}
