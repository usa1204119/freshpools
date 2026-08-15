import type { Metadata } from "next";
import Link from "next/link";
import { prisma, isDbConfigured } from "@/lib/db";
import {
  PageTitle,
  DataTable,
  Td,
  Tr,
  EmptyState,
  SetupNotice,
} from "@/components/app/shell";
import { StatusBadge, eventTone, humanizeEnum } from "@/components/ui/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { EventStatusForm } from "@/components/forms/event-form";
import { formatDateRange, formatPaise } from "@/lib/utils";

export const metadata: Metadata = { title: "Events", robots: { index: false } };

export default async function AdminEventsPage() {
  if (!isDbConfigured) return <SetupNotice />;

  const events = await prisma.event.findMany({
    orderBy: { startAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      mode: true,
      startAt: true,
      endAt: true,
      registrationFee: true,
      depositAmount: true,
      isSponsoredFree: true,
      sponsor: { select: { name: true } },
      college: { select: { name: true } },
      _count: { select: { registrations: true, teams: true } },
    },
  });

  return (
    <>
      <PageTitle
        title="Events"
        sub="Registrations, payments and refunds live inside each event."
        action={
          <ButtonLink href="/admin/events/new" size="sm">
            New event
          </ButtonLink>
        }
      />

      {events.length === 0 ? (
        <EmptyState
          title="No events yet."
          body="Create your first one — it saves as a draft, so nothing goes public until you say so."
          action={
            <ButtonLink href="/admin/events/new" size="sm">
              Create an event
            </ButtonLink>
          }
        />
      ) : (
        <DataTable
          caption="All events"
          headers={["Event", "Dates", "Status", "Entry", "Registered", ""]}
          minWidth={1040}
        >
          {events.map((event) => (
            <Tr key={event.id}>
              <Td>
                <Link
                  href={`/admin/events/${event.id}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {event.title}
                </Link>
                <p className="mono mt-1 text-eyebrow text-ink-muted">
                  {event.mode === "ONLINE" ? "Online" : "Offline"}
                  {event.college ? ` · ${event.college.name}` : ""}
                  {event.sponsor ? ` · sponsored by ${event.sponsor.name}` : ""}
                </p>
              </Td>
              <Td className="mono text-[12px] whitespace-nowrap">
                {formatDateRange(event.startAt, event.endAt)}
              </Td>
              <Td>
                <StatusBadge tone={eventTone[event.status] ?? "neutral"}>
                  {humanizeEnum(event.status)}
                </StatusBadge>
                <div className="mt-3">
                  <EventStatusForm eventId={event.id} status={event.status} />
                </div>
              </Td>
              <Td className="mono text-[12px] whitespace-nowrap">
                {event.isSponsoredFree ? (
                  <StatusBadge tone="pending">Free</StatusBadge>
                ) : (
                  <>
                    {formatPaise(event.registrationFee)}
                    <span className="mt-1 block text-ink-muted">
                      {formatPaise(event.depositAmount)} refundable
                    </span>
                  </>
                )}
              </Td>
              <Td className="mono tabular-nums">
                {event._count.registrations}
                <span className="mt-1 block text-eyebrow text-ink-muted">
                  {event._count.teams} teams
                </span>
              </Td>
              <Td>
                <div className="flex flex-col gap-1">
                  <Link
                    href={`/admin/events/${event.id}`}
                    className="mono text-eyebrow underline underline-offset-4"
                  >
                    Edit →
                  </Link>
                  <Link
                    href={`/admin/events/${event.id}/registrations`}
                    className="mono text-eyebrow underline underline-offset-4"
                  >
                    Registrations →
                  </Link>
                  {/* A draft has no public page to link to. */}
                  {event.status !== "DRAFT" ? (
                    <Link
                      href={`/hackathons/${event.slug}`}
                      className="mono text-eyebrow underline underline-offset-4"
                    >
                      Public page ↗
                    </Link>
                  ) : null}
                </div>
              </Td>
            </Tr>
          ))}
        </DataTable>
      )}
    </>
  );
}
