import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma, isDbConfigured } from "@/lib/db";
import {
  PageTitle,
  EmptyState,
  SetupNotice,
  StatRow,
  StatTile,
} from "@/components/app/shell";
import { Block } from "@/components/ui/block";
import {
  RefundDepositsButton,
  RefundAllButton,
} from "@/components/forms/admin-forms";
import { RegistrationsTable } from "@/components/app/tables/registrations-table";
import { razorpayConfigured } from "@/lib/razorpay";
import { formatPaise } from "@/lib/utils";

export const metadata: Metadata = { title: "Registrations", robots: { index: false } };

export default async function EventRegistrationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isDbConfigured) return <SetupNotice />;

  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      depositAmount: true,
      registrationFee: true,
      isSponsoredFree: true,
    },
  });
  if (!event) notFound();

  const registrations = await prisma.registration.findMany({
    where: { eventId: id },
    orderBy: [{ checkedIn: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      checkedIn: true,
      paymentStatus: true,
      amountPaid: true,
      refundStatus: true,
      refundAmount: true,
      tshirtSize: true,
      phone: true,
      candidate: {
        select: {
          id: true,
          college: true,
          gradYear: true,
          user: { select: { name: true, email: true } },
        },
      },
      team: { select: { id: true, name: true } },
    },
  });

  const paid = registrations.filter((r) => r.paymentStatus === "PAID").length;
  const outstanding = registrations.filter((r) =>
    ["PENDING", "FAILED"].includes(r.paymentStatus),
  ).length;
  const checkedIn = registrations.filter((r) => r.checkedIn).length;

  // Exactly the set the bulk refund action will act on.
  const refundEligible = registrations.filter(
    (r) =>
      r.checkedIn &&
      r.paymentStatus === "PAID" &&
      ["NOT_DUE", "DUE", "FAILED"].includes(r.refundStatus),
  ).length;

  const collected = registrations
    .filter((r) => r.paymentStatus === "PAID")
    .reduce((sum, r) => sum + r.amountPaid, 0);

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
        sub={`${registrations.length} registrations · ${formatPaise(collected)} collected`}
      />

      <StatRow>
        <StatTile label="Registered" value={registrations.length} />
        <StatTile label="Paid" value={paid} tone="blue" />
        <StatTile
          label="Outstanding"
          value={outstanding}
          tone={outstanding > 0 ? "yellow" : "white"}
        />
        <StatTile label="Checked in" value={checkedIn} tone="ink" />
      </StatRow>

      {/* ── Refund controls ────────────────────────────────────────────── */}
      <Block color="white" className="mt-8 p-6">
        <p className="mono mb-3 text-eyebrow">Deposit refunds</p>
        <p className="mb-5 max-w-2xl text-[15px] text-ink-muted">
          Refunds are never automatic. Check people in as they arrive, then issue
          the {formatPaise(event.depositAmount)} deposit back to everyone who
          actually turned up. Razorpay confirms each refund by webhook.
        </p>

        {!razorpayConfigured ? (
          <p className="mono border border-ink bg-block-yellow px-4 py-3 text-label">
            ✦ Razorpay is not configured on this deployment.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            <RefundDepositsButton eventId={event.id} eligibleCount={refundEligible} />
            {event.isSponsoredFree ? (
              <div className="border-t border-ink pt-6">
                <RefundAllButton eventId={event.id} />
              </div>
            ) : null}
          </div>
        )}
      </Block>

      <div className="mt-10">
        {registrations.length === 0 ? (
          <EmptyState
            title="Nobody registered yet."
            body="Registrations appear here the moment someone completes the form."
          />
        ) : (
          <RegistrationsTable
            rows={registrations.map((registration) => ({
              id: registration.id,
              name: registration.candidate.user.name,
              email: registration.candidate.user.email,
              phone: registration.phone,
              college: registration.candidate.college,
              gradYear: registration.candidate.gradYear,
              teamName: registration.team?.name ?? null,
              tshirtSize: registration.tshirtSize,
              paymentStatus: registration.paymentStatus,
              amountPaid: registration.amountPaid,
              refundStatus: registration.refundStatus,
              refundAmount: registration.refundAmount,
              checkedIn: registration.checkedIn,
            }))}
          />
        )}
      </div>
    </>
  );
}
