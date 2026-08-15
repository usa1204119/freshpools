import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma, isDbConfigured } from "@/lib/db";
import {
  PageTitle,
  DataTable,
  Td,
  Tr,
  EmptyState,
  SetupNotice,
} from "@/components/app/shell";
import {
  StatusBadge,
  paymentTone,
  refundTone,
  eventTone,
  humanizeEnum,
} from "@/components/ui/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { RazorpayCheckout } from "@/components/forms/razorpay-checkout";
import { WithdrawButton } from "@/components/forms/registration-forms";
import { razorpayConfigured } from "@/lib/razorpay";
import { formatDateRange, formatPaise } from "@/lib/utils";

export const metadata: Metadata = { title: "My events", robots: { index: false } };

export default async function MyHackathonsPage() {
  const session = await auth();
  if (!isDbConfigured || !session?.user) return <SetupNotice />;

  const candidate = await prisma.candidate.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const registrations = candidate
    ? await prisma.registration.findMany({
        where: { candidateId: candidate.id },
        orderBy: { event: { startAt: "desc" } },
        select: {
          id: true,
          paymentStatus: true,
          amountPaid: true,
          refundStatus: true,
          refundAmount: true,
          checkedIn: true,
          event: {
            select: {
              slug: true,
              title: true,
              status: true,
              startAt: true,
              endAt: true,
              registrationFee: true,
              depositAmount: true,
              isSponsoredFree: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
              joinCode: true,
              submission: { select: { id: true, submittedAt: true } },
            },
          },
        },
      })
    : [];

  return (
    <>
      <PageTitle
        title="My events"
        sub="Payment status, refunds and team for everything you've registered for."
        action={
          <ButtonLink href="/hackathons" size="sm">
            Find an event
          </ButtonLink>
        }
      />

      {registrations.length === 0 ? (
        <EmptyState
          title="Nothing here yet."
          body="Register for an event and it'll show up here with its payment and refund status."
          action={
            <ButtonLink href="/hackathons" size="sm">
              Browse events
            </ButtonLink>
          }
        />
      ) : (
        <>
          <DataTable
            caption="Your event registrations"
            headers={["Event", "Dates", "Team", "Entry", "Refund", "Actions"]}
            minWidth={900}
          >
            {registrations.map((registration) => {
              const { event, team } = registration;
              const needsPayment =
                !event.isSponsoredFree &&
                registration.paymentStatus !== "PAID" &&
                registration.paymentStatus !== "WAIVED";

              return (
                <Tr key={registration.id}>
                  <Td>
                    <Link
                      href={`/hackathons/${event.slug}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {event.title}
                    </Link>
                    <div className="mt-2">
                      <StatusBadge tone={eventTone[event.status] ?? "neutral"}>
                        {humanizeEnum(event.status)}
                      </StatusBadge>
                    </div>
                  </Td>

                  <Td className="mono text-[12px] whitespace-nowrap">
                    {formatDateRange(event.startAt, event.endAt)}
                  </Td>

                  <Td>
                    {team ? (
                      <>
                        <p className="font-medium">{team.name}</p>
                        <p className="mono mt-1 text-eyebrow text-ink-muted">
                          Code {team.joinCode}
                        </p>
                        {team.submission?.submittedAt ? (
                          <div className="mt-2">
                            <StatusBadge tone="done">Submitted</StatusBadge>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <StatusBadge tone="attention">No team</StatusBadge>
                    )}
                  </Td>

                  <Td>
                    <StatusBadge tone={paymentTone[registration.paymentStatus] ?? "neutral"}>
                      {humanizeEnum(registration.paymentStatus)}
                    </StatusBadge>
                    <p className="mono mt-2 text-eyebrow text-ink-muted">
                      {registration.paymentStatus === "PAID"
                        ? formatPaise(registration.amountPaid)
                        : event.isSponsoredFree
                          ? "Sponsored"
                          : formatPaise(event.registrationFee)}
                    </p>
                  </Td>

                  <Td>
                    <StatusBadge tone={refundTone[registration.refundStatus] ?? "neutral"}>
                      {humanizeEnum(registration.refundStatus)}
                    </StatusBadge>
                    <p className="mono mt-2 text-eyebrow text-ink-muted">
                      {registration.refundStatus === "PROCESSED"
                        ? formatPaise(registration.refundAmount ?? event.depositAmount)
                        : registration.paymentStatus === "PAID"
                          ? `${formatPaise(event.depositAmount)} on check-in`
                          : "—"}
                    </p>
                  </Td>

                  <Td>
                    <div className="flex flex-col gap-3">
                      {needsPayment && razorpayConfigured ? (
                        <RazorpayCheckout
                          registrationId={registration.id}
                          amount={event.registrationFee}
                          label={
                            registration.paymentStatus === "FAILED" ? "Retry" : "Pay"
                          }
                        />
                      ) : null}
                      {!team ? (
                        <Link
                          href={`/hackathons/${event.slug}/register`}
                          className="mono text-eyebrow underline underline-offset-4"
                        >
                          Sort out team →
                        </Link>
                      ) : (
                        <Link
                          href={`/me/team/${team.id}`}
                          className="mono text-eyebrow underline underline-offset-4"
                        >
                          Open team →
                        </Link>
                      )}
                      {/* Withdrawal is pointless once the event is over or
                          they've already been checked in on site. */}
                      {!registration.checkedIn &&
                      new Date(event.endAt).getTime() > Date.now() ? (
                        <WithdrawButton
                          registrationId={registration.id}
                          isPaid={registration.paymentStatus === "PAID"}
                          eventTitle={event.title}
                        />
                      ) : null}
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </DataTable>

          <p className="mt-6 max-w-2xl text-[14px] text-ink-muted">
            Deposits are refunded after an organiser verifies your check-in at the
            event — they are not automatic. FreshPools never charges students for
            placement or shortlisting.
          </p>
        </>
      )}
    </>
  );
}
