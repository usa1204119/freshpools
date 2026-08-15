import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma, isDbConfigured } from "@/lib/db";
import { PageTitle, SetupNotice, StatRow, StatTile } from "@/components/app/shell";
import { EventForm, PrizeManager } from "@/components/forms/event-form";
import { Block } from "@/components/ui/block";
import { StatusBadge, eventTone, humanizeEnum } from "@/components/ui/status-badge";
import { toIstInput } from "@/lib/datetime";
import { formatPaise } from "@/lib/utils";

export const metadata: Metadata = { title: "Edit event", robots: { index: false } };

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  if (!isDbConfigured) return <SetupNotice />;

  const [event, colleges, companies] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
      include: {
        prizes: { orderBy: { sortOrder: "asc" } },
        _count: { select: { registrations: true, teams: true } },
      },
    }),
    prisma.college.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!event) notFound();

  const paidCount = await prisma.registration.count({
    where: { eventId: id, paymentStatus: "PAID" },
  });

  return (
    <>
      <Link
        href="/admin/events"
        className="mono mb-6 inline-block text-eyebrow underline underline-offset-4"
      >
        ← All events
      </Link>

      <PageTitle
        title={event.title}
        sub={`/hackathons/${event.slug}`}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge tone={eventTone[event.status] ?? "neutral"}>
              {humanizeEnum(event.status)}
            </StatusBadge>
            {event.status !== "DRAFT" ? (
              <Link
                href={`/hackathons/${event.slug}`}
                className="mono text-eyebrow underline underline-offset-4"
              >
                View public page ↗
              </Link>
            ) : null}
          </div>
        }
      />

      {created ? (
        <Block color="yellow" className="mb-8 p-5">
          <p className="mono mb-2 text-eyebrow">✦ Event created</p>
          <p className="text-[15px]">
            It&apos;s a draft, so nothing is public yet. Add prizes below, then set
            the status to Announced or Registration open.
          </p>
        </Block>
      ) : null}

      <StatRow>
        <StatTile label="Registered" value={event._count.registrations} />
        <StatTile label="Teams" value={event._count.teams} tone="blue" />
        <StatTile label="Paid" value={paidCount} tone="yellow" />
        <StatTile
          label="Entry"
          value={event.isSponsoredFree ? "Free" : formatPaise(event.registrationFee)}
          note={
            event.isSponsoredFree
              ? "Sponsored"
              : `${formatPaise(event.depositAmount)} refundable`
          }
          tone="ink"
        />
      </StatRow>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href={`/admin/events/${event.id}/registrations`}
          className="mono border border-ink bg-block-white px-4 py-2.5 text-eyebrow hover:bg-block-yellow"
        >
          Registrations, payments &amp; refunds →
        </Link>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[3fr_2fr]">
        <section aria-labelledby="details-title">
          <h2 id="details-title" className="mono mb-4 text-label">
            Event details
          </h2>
          <EventForm
            colleges={colleges}
            companies={companies}
            defaults={{
              id: event.id,
              title: event.title,
              slug: event.slug,
              tagline: event.tagline ?? undefined,
              problemStatement: event.problemStatement,
              mode: event.mode,
              venue: event.venue ?? undefined,
              city: event.city ?? undefined,
              collegeId: event.collegeId ?? undefined,
              sponsorId: event.sponsorId ?? undefined,
              startAt: toIstInput(event.startAt),
              endAt: toIstInput(event.endAt),
              deadline: toIstInput(event.deadline),
              status: event.status,
              prizePool: event.prizePool ?? undefined,
              minTeamSize: event.minTeamSize,
              maxTeamSize: event.maxTeamSize,
              tracks: event.tracks,
              rules: event.rules,
              registrationFee: event.registrationFee,
              depositAmount: event.depositAmount,
              isSponsoredFree: event.isSponsoredFree,
              coverBlock: event.coverBlock,
            }}
          />
        </section>

        <section aria-labelledby="prizes-title" className="lg:sticky lg:top-32 lg:self-start">
          <h2 id="prizes-title" className="mono mb-4 text-label">
            Prizes
          </h2>
          <PrizeManager eventId={event.id} prizes={event.prizes} />
        </section>
      </div>
    </>
  );
}
