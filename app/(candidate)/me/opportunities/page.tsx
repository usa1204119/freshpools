import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma, isDbConfigured } from "@/lib/db";
import {
  PageTitle,
  EmptyState,
  SetupNotice,
  DataTable,
  Td,
  Tr,
} from "@/components/app/shell";
import { StatusBadge, introTone, humanizeEnum } from "@/components/ui/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { Block } from "@/components/ui/block";
import { IntroResponseButtons } from "@/components/forms/intro-response";
import { formatCtcRange, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Opportunities", robots: { index: false } };

export default async function OpportunitiesPage() {
  const session = await auth();
  if (!isDbConfigured || !session?.user) return <SetupNotice />;

  const candidate = await prisma.candidate.findUnique({
    where: { userId: session.user.id },
    select: { id: true, inTalentPool: true, availability: true },
  });

  const intros = candidate
    ? await prisma.intro.findMany({
        where: { candidateId: candidate.id },
        orderBy: { sentAt: "desc" },
        select: {
          id: true,
          status: true,
          sentAt: true,
          requirement: {
            select: {
              role: true,
              location: true,
              isRemote: true,
              ctcMin: true,
              ctcMax: true,
              stack: true,
              company: { select: { name: true } },
            },
          },
        },
      })
    : [];

  return (
    <>
      <PageTitle
        title="Opportunities"
        sub="Companies we've introduced you to. You decide whether we pass on your details."
      />

      {!candidate?.inTalentPool ? (
        <Block color="yellow" className="mb-8 p-6">
          <p className="mono mb-3 text-eyebrow">✦ Not in the talent pool yet</p>
          <p className="max-w-2xl text-[15px]">
            Introductions start once you have completed an event and we have
            reviewed your code, demo and viva. There is no way to pay for a place
            in the pool or for a better position in a shortlist.
          </p>
        </Block>
      ) : null}

      {intros.length === 0 ? (
        <EmptyState
          title="No introductions yet."
          body="When a company's requirement matches your reviewed work, we ask you first and then make the introduction."
          action={
            <ButtonLink href="/hackathons" size="sm">
              Find an event
            </ButtonLink>
          }
        />
      ) : (
        <DataTable
          caption="Company introductions"
          headers={["Company", "Role", "Package", "Sent", "Status", "Your response"]}
          minWidth={900}
        >
          {intros.map((intro) => (
            <Tr key={intro.id}>
              <Td className="font-medium">{intro.requirement.company.name}</Td>
              <Td>
                <p>{intro.requirement.role}</p>
                <p className="mono mt-1 text-eyebrow text-ink-muted">
                  {intro.requirement.isRemote
                    ? `${intro.requirement.location} · remote ok`
                    : intro.requirement.location}
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {intro.requirement.stack.slice(0, 4).map((tech) => (
                    <li
                      key={tech}
                      className="mono border border-ink px-1.5 py-0.5 text-eyebrow"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>
              </Td>
              <Td className="mono text-[12px] whitespace-nowrap">
                {formatCtcRange(intro.requirement.ctcMin, intro.requirement.ctcMax)}
              </Td>
              <Td className="mono text-[12px] whitespace-nowrap">
                {formatDate(intro.sentAt)}
              </Td>
              <Td>
                <StatusBadge tone={introTone[intro.status] ?? "neutral"}>
                  {humanizeEnum(intro.status)}
                </StatusBadge>
              </Td>
              <Td>
                {intro.status === "SENT" ? (
                  <IntroResponseButtons introId={intro.id} />
                ) : (
                  <span className="mono text-eyebrow text-ink-muted">—</span>
                )}
              </Td>
            </Tr>
          ))}
        </DataTable>
      )}

      <p className="mt-6 max-w-2xl text-[14px] text-ink-muted">
        We never hand a company your email or phone number without your yes. You
        are never charged for an introduction, a shortlist, or a placement.
      </p>
    </>
  );
}
