import type { Metadata } from "next";
import { prisma, isDbConfigured } from "@/lib/db";
import { PageTitle, EmptyState, SetupNotice } from "@/components/app/shell";
import { RequirementsTable } from "@/components/app/tables/requirements-table";

export const metadata: Metadata = { title: "Requirements", robots: { index: false } };

export default async function AdminRequirementsPage() {
  if (!isDbConfigured) return <SetupNotice />;

  const requirements = await prisma.requirement.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
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
      sponsorInterest: true,
      createdAt: true,
      company: {
        select: {
          name: true,
          contactPerson: true,
          contactEmail: true,
          contactPhone: true,
        },
      },
      _count: { select: { intros: true } },
    },
  });

  return (
    <>
      <PageTitle
        title="Requirements"
        sub="Inbound from /for-companies and from company accounts. Move each one along as you qualify it."
      />

      {requirements.length === 0 ? (
        <EmptyState
          title="No requirements yet."
          body="They land here the moment a company submits the form on /for-companies."
        />
      ) : (
        <RequirementsTable
          rows={requirements.map((requirement) => ({
            id: requirement.id,
            role: requirement.role,
            stack: requirement.stack,
            openings: requirement.openings,
            ctcMin: requirement.ctcMin,
            ctcMax: requirement.ctcMax,
            location: requirement.location,
            isRemote: requirement.isRemote,
            urgency: requirement.urgency,
            status: requirement.status,
            sponsorInterest: requirement.sponsorInterest,
            createdAt: requirement.createdAt.toISOString(),
            companyName: requirement.company.name,
            contactPerson: requirement.company.contactPerson,
            contactEmail: requirement.company.contactEmail,
            contactPhone: requirement.company.contactPhone,
            introCount: requirement._count.intros,
          }))}
        />
      )}
    </>
  );
}
