import type { Metadata } from "next";
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
import { StatusBadge, requirementTone, humanizeEnum } from "@/components/ui/status-badge";
import { Block } from "@/components/ui/block";
import { RequirementQuickForm } from "@/components/forms/company-forms";
import { formatCtcRange, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Requirements", robots: { index: false } };

export default async function CompanyRequirementsPage() {
  const session = await auth();
  if (!isDbConfigured || !session?.user) return <SetupNotice />;

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const requirements = company
    ? await prisma.requirement.findMany({
        where: { companyId: company.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          role: true,
          stack: true,
          openings: true,
          ctcMin: true,
          ctcMax: true,
          location: true,
          isRemote: true,
          urgency: true,
          status: true,
          createdAt: true,
          _count: { select: { intros: true } },
        },
      })
    : [];

  return (
    <>
      <PageTitle
        title="Requirements"
        sub="One row per role. We come back with matched profiles within seven days."
      />

      <div className="grid gap-10 lg:grid-cols-[3fr_2fr]">
        <section aria-labelledby="requirements-list">
          <h2 id="requirements-list" className="mono mb-4 text-label">
            Posted
          </h2>

          {requirements.length === 0 ? (
            <EmptyState
              title="Nothing posted yet."
              body="Use the form to describe one role. You can post as many as you have openings — there is no listing fee."
            />
          ) : (
            <DataTable
              caption="Your posted requirements"
              headers={["Role", "Package", "Location", "Status", "Intros"]}
              minWidth={640}
            >
              {requirements.map((requirement) => (
                <Tr key={requirement.id}>
                  <Td>
                    <p className="font-medium">{requirement.role}</p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {requirement.stack.slice(0, 5).map((tech) => (
                        <li
                          key={tech}
                          className="mono border border-ink px-1.5 py-0.5 text-eyebrow"
                        >
                          {tech}
                        </li>
                      ))}
                    </ul>
                    <p className="mono mt-2 text-eyebrow text-ink-muted">
                      Posted {formatDate(requirement.createdAt)}
                    </p>
                  </Td>
                  <Td className="mono text-[12px] whitespace-nowrap">
                    {formatCtcRange(requirement.ctcMin, requirement.ctcMax)}
                    <span className="mt-1 block text-ink-muted">
                      {requirement.openings}{" "}
                      {requirement.openings === 1 ? "opening" : "openings"}
                    </span>
                  </Td>
                  <Td className="text-[14px]">
                    {requirement.location}
                    {requirement.isRemote ? (
                      <span className="mono mt-1 block text-eyebrow text-ink-muted">
                        Remote ok
                      </span>
                    ) : null}
                  </Td>
                  <Td>
                    <StatusBadge tone={requirementTone[requirement.status] ?? "neutral"}>
                      {humanizeEnum(requirement.status)}
                    </StatusBadge>
                  </Td>
                  <Td className="mono tabular-nums">{requirement._count.intros}</Td>
                </Tr>
              ))}
            </DataTable>
          )}
        </section>

        <section aria-labelledby="new-requirement">
          <h2 id="new-requirement" className="mono mb-4 text-label">
            Post a new one
          </h2>
          <Block color="white" className="p-6">
            <RequirementQuickForm />
          </Block>
        </section>
      </div>
    </>
  );
}
