import type { Metadata } from "next";
import Link from "next/link";
import { prisma, isDbConfigured } from "@/lib/db";
import {
  PageTitle,
  StatRow,
  StatTile,
  SetupNotice,
  DataTable,
  Td,
  Tr,
  EmptyState,
} from "@/components/app/shell";
import { Block } from "@/components/ui/block";
import { StatusBadge, eventTone, humanizeEnum } from "@/components/ui/status-badge";
import { daysUntil, formatDate, formatPaise } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminOverviewPage() {
  if (!isDbConfigured) return <SetupNotice />;

  const [
    liveEvents,
    pendingPayments,
    refundsDue,
    unscored,
    newRequirements,
    pendingIntroRequests,
    feeDue,
    newEnquiries,
  ] = await Promise.all([
    prisma.event.findMany({
      where: { status: { in: ["REGISTRATION_OPEN", "LIVE", "JUDGING"] } },
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        startAt: true,
        deadline: true,
        _count: { select: { registrations: true, teams: true } },
      },
    }),
    prisma.registration.count({ where: { paymentStatus: { in: ["PENDING", "FAILED"] } } }),
    prisma.registration.count({
      where: { checkedIn: true, paymentStatus: "PAID", refundStatus: { in: ["NOT_DUE", "DUE"] } },
    }),
    prisma.submission.count({ where: { submittedAt: { not: null }, scores: { none: {} } } }),
    prisma.requirement.count({ where: { status: "NEW" } }),
    prisma.introRequest.count({ where: { status: "PENDING" } }),
    prisma.intro.findMany({
      where: { status: { in: ["JOINED", "CLEARED"] }, feeStatus: { in: ["NOT_DUE", "DUE"] } },
      select: {
        id: true,
        status: true,
        clearsAt: true,
        feeAmount: true,
        candidate: { select: { user: { select: { name: true } } } },
        requirement: { select: { role: true, company: { select: { name: true } } } },
      },
      orderBy: { clearsAt: "asc" },
      take: 8,
    }),
    prisma.collegeEnquiry.count({ where: { handled: false } }),
  ]);

  const actionItems = [
    { label: "Payments pending or failed", value: pendingPayments, href: "/admin/events" },
    { label: "Deposits to refund", value: refundsDue, href: "/admin/events" },
    { label: "Submissions to score", value: unscored, href: "/admin/scoring" },
    { label: "New requirements", value: newRequirements, href: "/admin/requirements" },
    { label: "Intro requests waiting", value: pendingIntroRequests, href: "/admin/intros" },
    { label: "College enquiries", value: newEnquiries, href: "/admin/colleges" },
  ].filter((item) => item.value > 0);

  return (
    <>
      <PageTitle title="Overview" sub="What needs a human right now." />

      <StatRow>
        <StatTile label="Live events" value={liveEvents.length} tone="blue" />
        <StatTile
          label="Payments outstanding"
          value={pendingPayments}
          tone={pendingPayments > 0 ? "yellow" : "white"}
        />
        <StatTile
          label="Refunds to issue"
          value={refundsDue}
          tone={refundsDue > 0 ? "coral" : "white"}
        />
        <StatTile label="Fees in flight" value={feeDue.length} tone="ink" />
      </StatRow>

      {actionItems.length > 0 ? (
        <section aria-labelledby="todo-title" className="mt-10">
          <h2 id="todo-title" className="mono mb-4 text-label">
            Needs attention
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {actionItems.map((item) => (
              <li key={item.label} className="border border-ink bg-block-white">
                <Link
                  href={item.href}
                  className="flex items-center justify-between gap-4 p-5 hover:bg-block-yellow"
                >
                  <span className="text-[15px]">{item.label}</span>
                  <span className="mono text-[20px] font-bold tabular-nums">
                    {item.value}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <Block color="yellow" className="mt-10 p-6">
          <p className="mono mb-2 text-eyebrow">✦ All clear</p>
          <p className="text-[15px]">Nothing is waiting on you.</p>
        </Block>
      )}

      <section aria-labelledby="events-title" className="mt-10">
        <h2 id="events-title" className="mono mb-4 text-label">
          Live events
        </h2>
        {liveEvents.length === 0 ? (
          <EmptyState
            title="No live events."
            body="Create one in the events area to start taking registrations."
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {liveEvents.map((event) => (
              <li key={event.id} className="border border-ink bg-block-white p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/admin/events/${event.id}/registrations`}
                      className="font-sans text-[20px] font-bold tracking-[-0.02em] underline-offset-4 hover:underline"
                    >
                      {event.title}
                    </Link>
                    <p className="mono mt-1 text-eyebrow text-ink-muted">
                      Starts {formatDate(event.startAt)}
                    </p>
                  </div>
                  <StatusBadge tone={eventTone[event.status] ?? "neutral"}>
                    {humanizeEnum(event.status)}
                  </StatusBadge>
                </div>
                <p className="mono mt-4 border-t border-ink pt-3 text-eyebrow text-ink-muted">
                  {event._count.registrations} registered · {event._count.teams} teams
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="ledger-title" className="mt-10">
        <h2 id="ledger-title" className="mono mb-4 text-label">
          Revenue ledger — 90-day clocks
        </h2>
        {feeDue.length === 0 ? (
          <EmptyState
            title="No hires in the clearance window."
            body="Fees appear here once an introduction reaches JOINED."
          />
        ) : (
          <DataTable
            caption="Introductions with a fee in flight"
            headers={["Candidate", "Company", "Role", "Clears", "Fee"]}
            minWidth={720}
          >
            {feeDue.map((intro) => {
              const days = intro.clearsAt ? daysUntil(intro.clearsAt) : null;
              return (
                <Tr key={intro.id}>
                  <Td className="font-medium">{intro.candidate.user.name}</Td>
                  <Td>{intro.requirement.company.name}</Td>
                  <Td className="text-[14px]">{intro.requirement.role}</Td>
                  <Td className="mono text-[12px] whitespace-nowrap">
                    {days === null ? (
                      "—"
                    ) : days > 0 ? (
                      `${days} days`
                    ) : (
                      <StatusBadge tone="pending">Due now</StatusBadge>
                    )}
                  </Td>
                  <Td className="mono text-[12px]">
                    {intro.feeAmount ? formatPaise(intro.feeAmount * 100) : "—"}
                  </Td>
                </Tr>
              );
            })}
          </DataTable>
        )}
        <p className="mt-4">
          <Link href="/admin/intros" className="mono text-eyebrow underline underline-offset-4">
            Open the full ledger →
          </Link>
        </p>
      </section>
    </>
  );
}
