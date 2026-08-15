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
import { StatusBadge, humanizeEnum } from "@/components/ui/status-badge";
import {
  EnquiryActions,
  CollegeStatusForm,
} from "@/components/forms/college-admin-forms";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Colleges", robots: { index: false } };

const collegeTone: Record<string, "pending" | "active" | "neutral"> = {
  PROSPECT: "pending",
  ACTIVE: "active",
  PAST: "neutral",
};

export default async function AdminCollegesPage() {
  if (!isDbConfigured) return <SetupNotice />;

  const [colleges, enquiries] = await Promise.all([
    prisma.college.findMany({
      orderBy: [{ status: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        city: true,
        status: true,
        tpoName: true,
        tpoContact: true,
        tpoEmail: true,
        workshopFee: true,
        studentCount: true,
        _count: { select: { events: true } },
      },
    }),
    prisma.collegeEnquiry.findMany({
      orderBy: [{ handled: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        collegeName: true,
        city: true,
        contactName: true,
        contactRole: true,
        email: true,
        phone: true,
        studentCount: true,
        department: true,
        preferredMonth: true,
        interestedIn: true,
        message: true,
        handled: true,
        collegeId: true,
        createdAt: true,
      },
    }),
  ]);

  const unhandled = enquiries.filter((enquiry) => !enquiry.handled).length;

  return (
    <>
      <PageTitle
        title="Colleges"
        sub="Enquiries from /for-colleges, and the colleges we already work with."
      />

      <StatRow>
        <StatTile label="Colleges" value={colleges.length} />
        <StatTile
          label="Active"
          value={colleges.filter((c) => c.status === "ACTIVE").length}
          tone="blue"
        />
        <StatTile label="Enquiries" value={enquiries.length} />
        <StatTile
          label="Unhandled"
          value={unhandled}
          tone={unhandled > 0 ? "coral" : "white"}
        />
      </StatRow>

      <section aria-labelledby="enquiries-title" className="mt-10">
        <h2 id="enquiries-title" className="mono mb-4 text-label">
          Enquiries
        </h2>
        {enquiries.length === 0 ? (
          <EmptyState
            title="No enquiries yet."
            body="They land here the moment a TPO submits the form on /for-colleges."
          />
        ) : (
          <DataTable
            caption="College enquiries"
            headers={["College", "Contact", "Wants", "When", "Received", "State", ""]}
            minWidth={1160}
          >
            {enquiries.map((enquiry) => (
              <Tr key={enquiry.id}>
                <Td>
                  <p className="font-medium">{enquiry.collegeName}</p>
                  <p className="mono mt-1 text-eyebrow text-ink-muted">
                    {enquiry.city}
                    {enquiry.studentCount ? ` · ${enquiry.studentCount} students` : ""}
                    {enquiry.department ? ` · ${enquiry.department}` : ""}
                  </p>
                </Td>
                <Td>
                  <p className="text-[14px]">{enquiry.contactName}</p>
                  <p className="mono mt-1 text-eyebrow text-ink-muted">
                    {enquiry.contactRole}
                  </p>
                  <p className="mono text-eyebrow text-ink-muted">{enquiry.email}</p>
                  {enquiry.phone ? (
                    <p className="mono text-eyebrow text-ink-muted">{enquiry.phone}</p>
                  ) : null}
                </Td>
                <Td>
                  <StatusBadge
                    tone={enquiry.interestedIn === "WORKSHOP" ? "pending" : "active"}
                  >
                    {humanizeEnum(enquiry.interestedIn)}
                  </StatusBadge>
                  {enquiry.message ? (
                    <p className="mt-2 max-w-xs text-[13px] text-ink-muted">
                      {enquiry.message}
                    </p>
                  ) : null}
                </Td>
                <Td className="mono text-[12px]">{enquiry.preferredMonth ?? "—"}</Td>
                <Td className="mono text-[12px] whitespace-nowrap">
                  {formatDate(enquiry.createdAt)}
                </Td>
                <Td>
                  {enquiry.handled ? (
                    <StatusBadge tone="done">Handled</StatusBadge>
                  ) : (
                    <StatusBadge tone="attention">New</StatusBadge>
                  )}
                  {enquiry.collegeId ? (
                    <p className="mono mt-2 text-eyebrow text-ink-muted">Linked</p>
                  ) : null}
                </Td>
                <Td>
                  <EnquiryActions
                    enquiryId={enquiry.id}
                    handled={enquiry.handled}
                    alreadyLinked={Boolean(enquiry.collegeId)}
                  />
                </Td>
              </Tr>
            ))}
          </DataTable>
        )}
      </section>

      <section aria-labelledby="colleges-title" className="mt-10">
        <h2 id="colleges-title" className="mono mb-4 text-label">
          Colleges on record
        </h2>
        {colleges.length === 0 ? (
          <EmptyState
            title="No colleges yet."
            body="Promote an enquiry into a college record once it's real."
          />
        ) : (
          <DataTable
            caption="Colleges"
            headers={["College", "TPO", "Status", "Workshop fee", "Events"]}
            minWidth={900}
          >
            {colleges.map((college) => (
              <Tr key={college.id}>
                <Td>
                  <p className="font-medium">{college.name}</p>
                  <p className="mono mt-1 text-eyebrow text-ink-muted">
                    {college.city}
                    {college.studentCount ? ` · ${college.studentCount} students` : ""}
                  </p>
                </Td>
                <Td className="text-[14px]">
                  {college.tpoName ?? "—"}
                  {college.tpoEmail ? (
                    <span className="mono mt-1 block text-eyebrow text-ink-muted">
                      {college.tpoEmail}
                    </span>
                  ) : null}
                  {college.tpoContact ? (
                    <span className="mono block text-eyebrow text-ink-muted">
                      {college.tpoContact}
                    </span>
                  ) : null}
                </Td>
                <Td>
                  <StatusBadge tone={collegeTone[college.status] ?? "neutral"}>
                    {humanizeEnum(college.status)}
                  </StatusBadge>
                  <div className="mt-3">
                    <CollegeStatusForm collegeId={college.id} status={college.status} />
                  </div>
                </Td>
                <Td className="mono text-[12px]">
                  {college.workshopFee
                    ? `₹${college.workshopFee.toLocaleString("en-IN")}`
                    : "—"}
                </Td>
                <Td className="mono tabular-nums">{college._count.events}</Td>
              </Tr>
            ))}
          </DataTable>
        )}
      </section>
    </>
  );
}
