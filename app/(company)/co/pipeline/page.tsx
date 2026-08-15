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
  StatRow,
  StatTile,
} from "@/components/app/shell";
import { StatusBadge, introTone, humanizeEnum } from "@/components/ui/status-badge";
import { Block } from "@/components/ui/block";
import { ButtonLink } from "@/components/ui/button";
import { candidateHandle, daysUntil, formatDate, formatLpa, maskName } from "@/lib/utils";

export const metadata: Metadata = { title: "Pipeline", robots: { index: false } };

const ACTIVE_STATUSES = ["SENT", "ACCEPTED", "INTERVIEWING", "OFFERED"] as const;

export default async function PipelinePage() {
  const session = await auth();
  if (!isDbConfigured || !session?.user) return <SetupNotice />;

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const [intros, pendingRequests] = await Promise.all([
    company
      ? prisma.intro.findMany({
          where: { requirement: { companyId: company.id } },
          orderBy: { sentAt: "desc" },
          select: {
            id: true,
            status: true,
            sentAt: true,
            joinedAt: true,
            clearsAt: true,
            offerCtc: true,
            requirement: { select: { role: true } },
            candidate: {
              select: {
                id: true,
                tier: true,
                college: true,
                user: { select: { name: true } },
              },
            },
          },
        })
      : Promise.resolve([]),
    company
      ? prisma.introRequest.findMany({
          where: { companyId: company.id, status: "PENDING" },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            createdAt: true,
            candidate: { select: { id: true, user: { select: { name: true } } } },
          },
        })
      : Promise.resolve([]),
  ]);

  const active = intros.filter((intro) =>
    (ACTIVE_STATUSES as readonly string[]).includes(intro.status),
  ).length;
  const joined = intros.filter((intro) =>
    ["JOINED", "CLEARED", "PAID"].includes(intro.status),
  ).length;

  return (
    <>
      <PageTitle
        title="Pipeline"
        sub="Every introduction we've made for you, and where it stands."
      />

      <StatRow>
        <StatTile label="Total introductions" value={intros.length} />
        <StatTile label="Active" value={active} tone="blue" />
        <StatTile label="Joined" value={joined} tone="yellow" />
        <StatTile
          label="Awaiting our reply"
          value={pendingRequests.length}
          note="Introduction requests"
          tone={pendingRequests.length > 0 ? "coral" : "white"}
        />
      </StatRow>

      {pendingRequests.length > 0 ? (
        <Block color="white" className="mt-8 p-6">
          <p className="mono mb-4 text-eyebrow">Requests we&apos;re working on</p>
          <ul className="flex flex-col gap-3">
            {pendingRequests.map((request) => (
              <li
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-ink pb-3 last:border-b-0 last:pb-0"
              >
                <span className="text-[15px]">
                  {maskName(request.candidate.user.name)}{" "}
                  <span className="mono text-eyebrow text-ink-muted">
                    {candidateHandle(request.candidate.id)}
                  </span>
                </span>
                <span className="mono text-eyebrow text-ink-muted">
                  Asked {formatDate(request.createdAt)} · we&apos;re checking with the
                  candidate
                </span>
              </li>
            ))}
          </ul>
        </Block>
      ) : null}

      <div className="mt-10">
        {intros.length === 0 ? (
          <EmptyState
            title="No introductions yet."
            body="Post a requirement, or request an introduction from a profile you've shortlisted."
            action={
              <ButtonLink href="/co/requirements" size="sm">
                Post a requirement
              </ButtonLink>
            }
          />
        ) : (
          <DataTable
            caption="Introduction pipeline"
            headers={["Candidate", "Role", "Introduced", "Status", "Offer", "90-day clock"]}
            minWidth={900}
          >
            {intros.map((intro) => {
              const daysLeft = intro.clearsAt ? daysUntil(intro.clearsAt) : null;
              return (
                <Tr key={intro.id}>
                  <Td>
                    <Link
                      href={`/co/talent/${intro.candidate.id}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {maskName(intro.candidate.user.name)}
                    </Link>
                    <p className="mono mt-1 text-eyebrow text-ink-muted">
                      {candidateHandle(intro.candidate.id)}
                      {intro.candidate.tier ? ` · Tier ${intro.candidate.tier}` : ""}
                    </p>
                  </Td>
                  <Td className="text-[14px]">{intro.requirement.role}</Td>
                  <Td className="mono text-[12px] whitespace-nowrap">
                    {formatDate(intro.sentAt)}
                  </Td>
                  <Td>
                    <StatusBadge tone={introTone[intro.status] ?? "neutral"}>
                      {humanizeEnum(intro.status)}
                    </StatusBadge>
                  </Td>
                  <Td className="mono text-[12px] whitespace-nowrap">
                    {intro.offerCtc ? formatLpa(intro.offerCtc) : "—"}
                  </Td>
                  <Td className="mono text-[12px] whitespace-nowrap">
                    {intro.joinedAt && daysLeft !== null ? (
                      daysLeft > 0 ? (
                        `${daysLeft} days to go`
                      ) : (
                        <StatusBadge tone="done">Cleared</StatusBadge>
                      )
                    ) : (
                      "—"
                    )}
                  </Td>
                </Tr>
              );
            })}
          </DataTable>
        )}
      </div>

      <p className="mt-6 max-w-2xl text-[14px] text-ink-muted">
        The placement fee is invoiced only after a hire completes 90 days. If they
        do not last, no fee is due.
      </p>
    </>
  );
}
