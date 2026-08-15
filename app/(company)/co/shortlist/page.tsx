import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma, isDbConfigured } from "@/lib/db";
import { PageTitle, EmptyState, SetupNotice } from "@/components/app/shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { Block, blockAt } from "@/components/ui/block";
import { ShortlistButton } from "@/components/forms/company-forms";
import { ButtonLink } from "@/components/ui/button";
import { candidateHandle, maskName, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Shortlist", robots: { index: false } };

export default async function ShortlistPage() {
  const session = await auth();
  if (!isDbConfigured || !session?.user) return <SetupNotice />;

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  // No contact fields selected — the shape cannot leak an email.
  const items = company
    ? await prisma.shortlistItem.findMany({
        where: { companyId: company.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          candidate: {
            select: {
              id: true,
              college: true,
              gradYear: true,
              skills: true,
              tier: true,
              availability: true,
              videoUrl: true,
              user: { select: { name: true } },
            },
          },
        },
      })
    : [];

  return (
    <>
      <PageTitle
        title="Shortlist"
        sub="Profiles you've saved. Requesting an introduction is the next step — we ask the candidate before sharing anything."
        action={
          <ButtonLink href="/co/talent" size="sm" variant="secondary">
            Browse talent
          </ButtonLink>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title="Your shortlist is empty."
          body="Save profiles from the talent page and they collect here."
          action={
            <ButtonLink href="/co/talent" size="sm">
              Browse talent
            </ButtonLink>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <Block
              key={item.id}
              as="li"
              color={blockAt(index)}
              className="flex h-full flex-col gap-4 p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/co/talent/${item.candidate.id}`}
                    className="font-sans text-[20px] font-bold tracking-[-0.02em] underline-offset-4 hover:underline"
                  >
                    {maskName(item.candidate.user.name)}
                  </Link>
                  <p className="mono mt-1 text-eyebrow text-ink-muted">
                    {candidateHandle(item.candidate.id)}
                  </p>
                </div>
                {item.candidate.tier ? (
                  <StatusBadge tone="done">Tier {item.candidate.tier}</StatusBadge>
                ) : null}
              </div>

              <p className="text-[14px] text-ink-muted">
                {item.candidate.college} · {item.candidate.gradYear}
              </p>

              <ul className="flex flex-wrap gap-1.5">
                {item.candidate.skills.slice(0, 5).map((skill) => (
                  <li
                    key={skill}
                    className="mono border border-ink px-1.5 py-0.5 text-eyebrow"
                  >
                    {skill}
                  </li>
                ))}
              </ul>

              <p className="mono text-eyebrow text-ink-muted">
                Saved {formatDate(item.createdAt)}
              </p>

              <div className="mt-auto flex flex-col gap-2 pt-2">
                <ShortlistButton candidateId={item.candidate.id} saved />
                <Link
                  href={`/co/talent/${item.candidate.id}`}
                  className="mono text-eyebrow underline underline-offset-4"
                >
                  Request introduction →
                </Link>
              </div>
            </Block>
          ))}
        </ul>
      )}
    </>
  );
}
