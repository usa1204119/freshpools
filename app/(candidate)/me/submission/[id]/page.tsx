import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma, isDbConfigured } from "@/lib/db";
import { SetupNotice } from "@/components/app/shell";

/**
 * A submission is always edited in the context of its team, so this route is a
 * permalink that resolves to the team page rather than a second editor.
 */
export default async function SubmissionRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!isDbConfigured || !session?.user) return <SetupNotice />;

  const candidate = await prisma.candidate.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!candidate) notFound();

  const submission = await prisma.submission.findUnique({
    where: { id },
    select: {
      teamId: true,
      team: { select: { members: { select: { candidateId: true } } } },
    },
  });

  if (!submission) notFound();
  if (!submission.team.members.some((m) => m.candidateId === candidate.id)) {
    notFound();
  }

  redirect(`/me/team/${submission.teamId}`);
}
