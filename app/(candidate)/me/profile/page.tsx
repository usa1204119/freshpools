import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma, isDbConfigured } from "@/lib/db";
import { PageTitle, SetupNotice } from "@/components/app/shell";
import { CandidateProfileForm } from "@/components/forms/profile-forms";
import { uploadthingConfigured } from "@/lib/uploadthing";
import { Block } from "@/components/ui/block";
import { StatusBadge } from "@/components/ui/status-badge";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

export default async function CandidateProfilePage() {
  const session = await auth();
  if (!isDbConfigured || !session?.user) return <SetupNotice />;

  const candidate = await prisma.candidate.findUnique({
    where: { userId: session.user.id },
    select: {
      college: true,
      gradYear: true,
      github: true,
      linkedin: true,
      skills: true,
      resumeUrl: true,
      videoUrl: true,
      availability: true,
      tier: true,
      inTalentPool: true,
      user: { select: { name: true, phone: true, email: true } },
    },
  });

  return (
    <>
      <PageTitle
        title="Profile"
        sub="This is what a hiring company sees — minus your email and phone, which we never show them."
      />

      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <Block color="white" className="p-6 lg:p-8">
          <CandidateProfileForm
            uploadsEnabled={uploadthingConfigured}
            defaults={{
              name: candidate?.user.name,
              phone: candidate?.user.phone ?? undefined,
              college: candidate?.college,
              gradYear: candidate?.gradYear,
              github: candidate?.github,
              linkedin: candidate?.linkedin ?? undefined,
              skills: candidate?.skills,
              resumeUrl: candidate?.resumeUrl ?? undefined,
              videoUrl: candidate?.videoUrl ?? undefined,
              availability: candidate?.availability,
            }}
          />
        </Block>

        <aside className="flex flex-col gap-6">
          <Block color="blue" className="p-6">
            <p className="mono mb-4 text-eyebrow">Verification status</p>
            <dl className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[15px]">Tier</dt>
                <dd>
                  {candidate?.tier ? (
                    <StatusBadge tone="done">Tier {candidate.tier}</StatusBadge>
                  ) : (
                    <StatusBadge tone="pending">Not rated yet</StatusBadge>
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[15px]">Talent pool</dt>
                <dd>
                  {candidate?.inTalentPool ? (
                    <StatusBadge tone="done">Listed</StatusBadge>
                  ) : (
                    <StatusBadge tone="neutral">Not listed</StatusBadge>
                  )}
                </dd>
              </div>
            </dl>
            <p className="mt-5 border-t border-ink pt-4 text-[14px]">
              A tier is assigned after we review your work from an event — the
              code, the demo, and the viva. You cannot buy or request one.
            </p>
          </Block>

          <Block color="white" className="p-6">
            <p className="mono mb-3 text-eyebrow">What companies never see</p>
            <ul className="flex flex-col gap-2 text-[15px] text-ink-muted">
              <li className="flex gap-3">
                <span aria-hidden="true">✦</span> Your email address
              </li>
              <li className="flex gap-3">
                <span aria-hidden="true">✦</span> Your phone number
              </li>
              <li className="flex gap-3">
                <span aria-hidden="true">✦</span> Our internal review notes
              </li>
            </ul>
            <p className="mt-4 text-[14px] text-ink-muted">
              Every introduction is brokered by us, with your consent first.
            </p>
          </Block>
        </aside>
      </div>
    </>
  );
}
