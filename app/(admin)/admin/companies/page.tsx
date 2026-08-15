import type { Metadata } from "next";
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
import { StatusBadge } from "@/components/ui/status-badge";
import { CompanyFlagToggle } from "@/components/forms/college-admin-forms";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Companies", robots: { index: false } };

export default async function AdminCompaniesPage() {
  if (!isDbConfigured) return <SetupNotice />;

  const companies = await prisma.company.findMany({
    orderBy: [{ isHiringPartner: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      website: true,
      contactPerson: true,
      contactEmail: true,
      contactPhone: true,
      agreementSigned: true,
      isHiringPartner: true,
      createdAt: true,
      _count: { select: { requirements: true, sponsoredEvents: true } },
    },
  });

  const partners = companies.filter((company) => company.isHiringPartner).length;
  const signed = companies.filter((company) => company.agreementSigned).length;
  const sponsors = companies.filter(
    (company) => company._count.sponsoredEvents > 0,
  ).length;

  return (
    <>
      <PageTitle
        title="Companies"
        sub="Marking a company as a hiring partner is what puts its name in the public marquee — only do it when it's true."
      />

      <StatRow>
        <StatTile label="Companies" value={companies.length} />
        <StatTile label="Agreements signed" value={signed} tone="blue" />
        <StatTile label="Hiring partners" value={partners} tone="yellow" />
        <StatTile label="Sponsors" value={sponsors} tone="ink" />
      </StatRow>

      <div className="mt-10">
        {companies.length === 0 ? (
          <EmptyState
            title="No companies yet."
            body="A company record is created the first time someone submits a requirement."
          />
        ) : (
          <DataTable
            caption="All companies"
            headers={[
              "Company",
              "Contact",
              "Agreement",
              "Partner",
              "Requirements",
              "Sponsored",
              "Added",
            ]}
            minWidth={1240}
          >
            {companies.map((company) => (
              <Tr key={company.id}>
                <Td>
                  <p className="font-medium">{company.name}</p>
                  {company.website ? (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mono mt-1 block text-eyebrow underline underline-offset-4"
                    >
                      {company.website.replace(/^https?:\/\//, "")} ↗
                    </a>
                  ) : null}
                </Td>
                <Td className="text-[14px]">
                  {company.contactPerson}
                  {company.contactEmail ? (
                    <span className="mono mt-1 block text-eyebrow text-ink-muted">
                      {company.contactEmail}
                    </span>
                  ) : null}
                  {company.contactPhone ? (
                    <span className="mono block text-eyebrow text-ink-muted">
                      {company.contactPhone}
                    </span>
                  ) : null}
                </Td>
                <Td>
                  {company.agreementSigned ? (
                    <StatusBadge tone="done">Signed</StatusBadge>
                  ) : (
                    <StatusBadge tone="attention">Pending</StatusBadge>
                  )}
                  <div className="mt-3">
                    <CompanyFlagToggle
                      companyId={company.id}
                      flag="agreementSigned"
                      active={company.agreementSigned}
                      label="signed"
                      consequence="We rely on a signed agreement before making any introduction. Only mark this when the paperwork actually exists."
                    />
                  </div>
                </Td>
                <Td>
                  {company.isHiringPartner ? (
                    <StatusBadge tone="active">In marquee</StatusBadge>
                  ) : (
                    <StatusBadge tone="neutral">No</StatusBadge>
                  )}
                  <div className="mt-3">
                    <CompanyFlagToggle
                      companyId={company.id}
                      flag="isHiringPartner"
                      active={company.isHiringPartner}
                      label="partner"
                      consequence="This publishes the company name in the marquee on the public landing page. Never set it for a company that is not genuinely a partner."
                    />
                  </div>
                </Td>
                <Td className="mono tabular-nums">{company._count.requirements}</Td>
                <Td className="mono tabular-nums">{company._count.sponsoredEvents}</Td>
                <Td className="mono text-[12px] whitespace-nowrap">
                  {formatDate(company.createdAt)}
                </Td>
              </Tr>
            ))}
          </DataTable>
        )}
      </div>

      <p className="mt-6 max-w-2xl text-[14px] text-ink-muted">
        Both flags are two-step on purpose. Marking a company a hiring partner
        publishes its name on the public landing page, and the agreement flag is
        what we rely on before making any introduction.
      </p>
    </>
  );
}
