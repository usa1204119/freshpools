import type { Metadata } from "next";
import { prisma, isDbConfigured } from "@/lib/db";
import {
  PageTitle,
  EmptyState,
  SetupNotice,
  StatRow,
  StatTile,
} from "@/components/app/shell";
import { Block } from "@/components/ui/block";
import { IntrosTable } from "@/components/app/tables/intros-table";
import { candidateHandle, daysUntil, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Intros ledger", robots: { index: false } };

/** ISO date for a <input type="date"> default value. */
function isoDate(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

export default async function IntrosLedgerPage() {
  if (!isDbConfigured) return <SetupNotice />;

  const [intros, pendingRequests] = await Promise.all([
    prisma.intro.findMany({
      orderBy: [{ status: "asc" }, { sentAt: "desc" }],
      select: {
        id: true,
        status: true,
        sentAt: true,
        joinedAt: true,
        clearsAt: true,
        offerCtc: true,
        feeAmount: true,
        feeStatus: true,
        candidate: {
          select: { id: true, tier: true, user: { select: { name: true } } },
        },
        requirement: {
          select: { role: true, company: { select: { name: true } } },
        },
        events: {
          select: { to: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.introRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        createdAt: true,
        message: true,
        company: { select: { name: true } },
        candidate: { select: { id: true, user: { select: { name: true } } } },
        requirement: { select: { role: true } },
      },
    }),
  ]);

  const joined = intros.filter((i) =>
    ["JOINED", "CLEARED", "PAID"].includes(i.status),
  );
  const feeDue = intros.filter((i) => i.feeStatus === "DUE");
  const clearingSoon = intros.filter(
    (i) => i.clearsAt && daysUntil(i.clearsAt) > 0 && daysUntil(i.clearsAt) <= 14,
  );
  const totalBilled = intros
    .filter((i) => i.feeStatus === "PAID")
    .reduce((sum, i) => sum + (i.feeAmount ?? 0), 0);

  return (
    <>
      <PageTitle
        title="Intros ledger"
        sub="Every introduction ever made, with its 90-day clock. This is the revenue record — and the proof in a dispute."
      />

      <StatRow>
        <StatTile label="Total intros" value={intros.length} />
        <StatTile label="Joined" value={joined.length} tone="blue" />
        <StatTile
          label="Fees due"
          value={feeDue.length}
          tone={feeDue.length > 0 ? "coral" : "white"}
        />
        <StatTile
          label="Collected"
          value={totalBilled > 0 ? `₹${(totalBilled / 100000).toFixed(1)}L` : "₹0"}
          tone="ink"
        />
      </StatRow>

      {clearingSoon.length > 0 ? (
        <Block color="yellow" className="mt-8 p-6">
          <p className="mono mb-3 text-eyebrow">✦ Clearing within 14 days</p>
          <ul className="flex flex-col gap-2">
            {clearingSoon.map((intro) => (
              <li key={intro.id} className="text-[15px]">
                {intro.candidate.user.name} at {intro.requirement.company.name} —{" "}
                <span className="mono text-eyebrow">
                  {daysUntil(intro.clearsAt!)} days
                </span>
              </li>
            ))}
          </ul>
        </Block>
      ) : null}

      {pendingRequests.length > 0 ? (
        <section aria-labelledby="requests-title" className="mt-10">
          <h2 id="requests-title" className="mono mb-4 text-label">
            Introduction requests from companies
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {pendingRequests.map((request) => (
              <li key={request.id} className="border border-ink bg-block-white p-5">
                <p className="font-medium">
                  {request.company.name} → {request.candidate.user.name}
                </p>
                <p className="mono mt-1 text-eyebrow text-ink-muted">
                  {candidateHandle(request.candidate.id)}
                  {request.requirement ? ` · ${request.requirement.role}` : ""} ·{" "}
                  {formatDate(request.createdAt)}
                </p>
                {request.message ? (
                  <p className="mt-3 border-t border-ink pt-3 text-[14px] text-ink-muted">
                    {request.message}
                  </p>
                ) : null}
                <p className="mono mt-3 text-eyebrow text-ink-muted">
                  Ask the candidate, then send the intro from the matching page.
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-10">
        {intros.length === 0 ? (
          <EmptyState
            title="No introductions yet."
            body="Send the first one from a requirement's matching page."
          />
        ) : (
          <IntrosTable
            rows={intros.map((intro) => ({
              id: intro.id,
              candidateId: intro.candidate.id,
              candidateName: intro.candidate.user.name,
              tier: intro.candidate.tier,
              companyName: intro.requirement.company.name,
              role: intro.requirement.role,
              sentAt: intro.sentAt.toISOString(),
              joinedAt: intro.joinedAt ? intro.joinedAt.toISOString() : null,
              joinedAtInput: isoDate(intro.joinedAt),
              clearsAt: intro.clearsAt ? intro.clearsAt.toISOString() : null,
              offerCtc: intro.offerCtc,
              feeAmount: intro.feeAmount,
              feeStatus: intro.feeStatus,
              status: intro.status,
            }))}
          />
        )}
      </div>
    </>
  );
}
