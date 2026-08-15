import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma, isDbConfigured } from "@/lib/db";
import {
  PageTitle,
  StatRow,
  StatTile,
  EmptyState,
  SetupNotice,
} from "@/components/app/shell";
import { ButtonLink } from "@/components/ui/button";
import { Block } from "@/components/ui/block";
import { StatusBadge, requirementTone, humanizeEnum } from "@/components/ui/status-badge";
import { formatCtcRange, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default async function CompanyDashboard() {
  const session = await auth();
  if (!isDbConfigured || !session?.user) return <SetupNotice />;

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    select: { id: true, name: true, agreementSigned: true },
  });

  if (!company) {
    return (
      <>
        <PageTitle title="Dashboard" />
        <EmptyState
          title="Finish setting up your company."
          body="We need your company details before you can post a requirement."
          action={<ButtonLink href="/onboarding">Complete setup</ButtonLink>}
        />
      </>
    );
  }

  const [requirements, shortlistCount, introCount, poolCount] = await Promise.all([
    prisma.requirement.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        role: true,
        status: true,
        openings: true,
        ctcMin: true,
        ctcMax: true,
        createdAt: true,
        _count: { select: { intros: true } },
      },
    }),
    prisma.shortlistItem.count({ where: { companyId: company.id } }),
    prisma.intro.count({ where: { requirement: { companyId: company.id } } }),
    prisma.candidate.count({ where: { inTalentPool: true } }),
  ]);

  const openRequirements = requirements.filter(
    (requirement) => !["CLOSED", "LOST"].includes(requirement.status),
  ).length;

  return (
    <>
      <PageTitle
        title={company.name}
        sub="You pay only when a hire clears 90 days with you."
        action={
          <ButtonLink href="/co/requirements" size="sm">
            Post a requirement
          </ButtonLink>
        }
      />

      <StatRow>
        <StatTile label="Open requirements" value={openRequirements} tone="blue" />
        <StatTile label="Shortlisted" value={shortlistCount} />
        <StatTile label="Introductions" value={introCount} tone="yellow" />
        <StatTile
          label="Verified pool"
          value={poolCount}
          note="Candidates available now"
          tone="ink"
        />
      </StatRow>

      {!company.agreementSigned ? (
        <Block color="coral" className="mt-8 p-6">
          <p className="mono mb-3 text-eyebrow">✦ Agreement pending</p>
          <p className="max-w-2xl text-[15px]">
            We agree the placement fee in writing before making any introduction —
            never after. Reply to our email, or write to{" "}
            <a href="mailto:hello@freshpools.in" className="underline underline-offset-4">
              hello@freshpools.in
            </a>{" "}
            and we&apos;ll send it over.
          </p>
        </Block>
      ) : null}

      <section aria-labelledby="recent-requirements" className="mt-10">
        <h2 id="recent-requirements" className="mono mb-4 text-label">
          Recent requirements
        </h2>

        {requirements.length === 0 ? (
          <EmptyState
            title="No requirements yet."
            body="Tell us one role and we'll come back within seven days with matched profiles."
            action={
              <ButtonLink href="/co/requirements" size="sm">
                Post a requirement
              </ButtonLink>
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {requirements.map((requirement) => (
              <li key={requirement.id} className="border border-ink bg-block-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-sans text-[20px] font-bold tracking-[-0.02em]">
                      {requirement.role}
                    </p>
                    <p className="mono mt-1 text-eyebrow text-ink-muted">
                      {requirement.openings}{" "}
                      {requirement.openings === 1 ? "opening" : "openings"} ·{" "}
                      {formatCtcRange(requirement.ctcMin, requirement.ctcMax)}
                    </p>
                  </div>
                  <StatusBadge tone={requirementTone[requirement.status] ?? "neutral"}>
                    {humanizeEnum(requirement.status)}
                  </StatusBadge>
                </div>
                <p className="mono mt-4 border-t border-ink pt-3 text-eyebrow text-ink-muted">
                  Posted {formatDate(requirement.createdAt)} ·{" "}
                  {requirement._count.intros} intro
                  {requirement._count.intros === 1 ? "" : "s"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
