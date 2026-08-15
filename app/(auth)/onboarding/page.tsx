import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma, isDbConfigured } from "@/lib/db";
import { CandidateProfileForm, CompanyProfileForm } from "@/components/forms/profile-forms";
import { Eyebrow, MixedHeadline } from "@/components/marketing/mixed-headline";
import { Block } from "@/components/ui/block";

export const metadata: Metadata = {
  title: "Finish setting up",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { next } = await searchParams;
  const role = session.user.role;

  if (role === "ADMIN") redirect("/admin");

  // Already onboarded? Send them straight to where they were going.
  if (isDbConfigured) {
    const existing =
      role === "CANDIDATE"
        ? await prisma.candidate.findUnique({
            where: { userId: session.user.id },
            select: { id: true },
          })
        : await prisma.company.findUnique({
            where: { userId: session.user.id },
            select: { id: true },
          });

    if (existing) {
      const fallback = role === "CANDIDATE" ? "/me" : "/co";
      redirect(next?.startsWith("/") && !next.startsWith("//") ? next : fallback);
    }
  }

  const isCandidate = role === "CANDIDATE";

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-[2fr_3fr] lg:gap-16">
      <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
        <Eyebrow>One more step</Eyebrow>
        <MixedHeadline
          text={
            isCandidate
              ? "Tell us **who you are.**"
              : "Tell us about **your company.**"
          }
          as="h1"
          size="h2"
          className="max-w-[13ch]"
        />
        <p className="max-w-md text-body-lg text-ink-muted">
          {isCandidate
            ? "This is the profile companies eventually see — minus your contact details, which we never show them."
            : "We use this on your requirements and agreements. Two minutes, once."}
        </p>

        {isCandidate ? (
          <Block color="blue" className="p-6">
            <p className="mono mb-2 text-eyebrow">What companies see</p>
            <p className="text-[15px] leading-relaxed">
              Your work, your skills, your college and your demo video. Your
              email and phone number stay with us — every introduction is
              brokered by us, with your consent.
            </p>
          </Block>
        ) : null}
      </div>

      <Block color="white" className="p-6 lg:p-10">
        {isCandidate ? (
          <CandidateProfileForm
            mode="onboarding"
            next={next}
            defaults={{ name: session.user.name ?? undefined }}
          />
        ) : (
          <CompanyProfileForm
            mode="onboarding"
            defaults={{ contactPerson: session.user.name ?? undefined }}
          />
        )}
      </Block>
    </div>
  );
}
