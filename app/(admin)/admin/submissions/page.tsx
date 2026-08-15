import type { Metadata } from "next";
import Link from "next/link";
import { prisma, isDbConfigured } from "@/lib/db";
import {
  PageTitle,
  DataTable,
  Td,
  Tr,
  EmptyState,
  SetupNotice,
} from "@/components/app/shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Submissions", robots: { index: false } };

export default async function AdminSubmissionsPage() {
  if (!isDbConfigured) return <SetupNotice />;

  const submissions = await prisma.submission.findMany({
    orderBy: [{ submittedAt: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      repoUrl: true,
      videoUrl: true,
      stack: true,
      submittedAt: true,
      contributions: true,
      team: {
        select: {
          id: true,
          name: true,
          event: { select: { title: true, slug: true } },
          members: { select: { candidateId: true } },
        },
      },
      _count: { select: { scores: true } },
    },
  });

  return (
    <>
      <PageTitle
        title="Submissions"
        sub="Everything teams have entered. Scoring happens per person, in the scoring area."
      />

      {submissions.length === 0 ? (
        <EmptyState
          title="No submissions yet."
          body="They appear here as soon as a team saves a draft."
        />
      ) : (
        <DataTable
          caption="All submissions"
          headers={["Project", "Event", "Team", "Stack", "State", "Links"]}
          minWidth={1000}
        >
          {submissions.map((submission) => {
            const scored = submission._count.scores;
            const members = submission.team.members.length;
            return (
              <Tr key={submission.id}>
                <Td>
                  <p className="font-medium">{submission.title}</p>
                  <p className="mono mt-1 text-eyebrow text-ink-muted">
                    {submission.submittedAt
                      ? `Submitted ${formatDate(submission.submittedAt)}`
                      : "Draft"}
                  </p>
                </Td>
                <Td className="text-[14px]">{submission.team.event.title}</Td>
                <Td className="text-[14px]">
                  {submission.team.name}
                  <span className="mono mt-1 block text-eyebrow text-ink-muted">
                    {members} {members === 1 ? "member" : "members"}
                  </span>
                </Td>
                <Td>
                  <ul className="flex flex-wrap gap-1.5">
                    {submission.stack.slice(0, 5).map((tech) => (
                      <li
                        key={tech}
                        className="mono border border-ink px-1.5 py-0.5 text-eyebrow"
                      >
                        {tech}
                      </li>
                    ))}
                  </ul>
                </Td>
                <Td>
                  {!submission.submittedAt ? (
                    <StatusBadge tone="pending">Draft</StatusBadge>
                  ) : scored === 0 ? (
                    <StatusBadge tone="attention">Unscored</StatusBadge>
                  ) : scored < members ? (
                    <StatusBadge tone="pending">
                      {scored}/{members} scored
                    </StatusBadge>
                  ) : (
                    <StatusBadge tone="done">Scored</StatusBadge>
                  )}
                </Td>
                <Td>
                  <div className="flex flex-col gap-1">
                    <a
                      href={submission.repoUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mono text-eyebrow underline underline-offset-4"
                    >
                      Repo ↗
                    </a>
                    <a
                      href={submission.videoUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mono text-eyebrow underline underline-offset-4"
                    >
                      Demo ↗
                    </a>
                    <Link
                      href={`/admin/scoring?submission=${submission.id}`}
                      className="mono text-eyebrow underline underline-offset-4"
                    >
                      Score →
                    </Link>
                  </div>
                </Td>
              </Tr>
            );
          })}
        </DataTable>
      )}
    </>
  );
}
