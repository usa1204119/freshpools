import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, DASHBOARD_BY_ROLE } from "@/lib/auth";
import { OtpForm } from "@/components/forms/otp-form";
import { Eyebrow, MixedHeadline } from "@/components/marketing/mixed-headline";
import { Block } from "@/components/ui/block";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: false },
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; next?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect(DASHBOARD_BY_ROLE[session.user.role]);

  const { role, next } = await searchParams;
  const isCompany = role?.toLowerCase() === "company";
  const intendedRole = isCompany ? "COMPANY" : "CANDIDATE";

  const benefits = isCompany
    ? [
        "Post requirements and track every one in a pipeline",
        "Browse verified profiles with demo video and repository",
        "Request introductions — we broker each one with consent",
        "Pay only when a hire clears 90 days",
      ]
    : [
        "Register for events and manage your team",
        "Keep a verified profile after every event you finish",
        "Get introduced to hiring companies directly",
        "Never pay us for placement or a shortlist position",
      ];

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-2 lg:gap-16">
      <div className="flex flex-col gap-6">
        <Eyebrow>Create an account</Eyebrow>
        <MixedHeadline
          text={
            isCompany
              ? "Hire freshers you can **actually assess.**"
              : "Build something. **Get seen.**"
          }
          as="h1"
          size="h2"
          className="max-w-[14ch]"
        />

        {/* Role switch — the choice only matters for brand-new accounts. */}
        <div
          role="group"
          aria-label="Account type"
          className="flex w-max border border-ink"
        >
          {[
            { value: "student", label: "I'm a student", active: !isCompany },
            { value: "company", label: "I'm hiring", active: isCompany },
          ].map((option) => (
            <Link
              key={option.value}
              href={`/signup?role=${option.value}`}
              aria-current={option.active ? "true" : undefined}
              className={cn(
                "mono border-r border-ink px-4 py-2.5 text-eyebrow last:border-r-0",
                option.active ? "bg-ink text-white" : "bg-block-white text-ink",
              )}
            >
              {option.label}
            </Link>
          ))}
        </div>

        <ul className="flex flex-col gap-3">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex gap-3 text-[15px] text-ink-muted">
              <span aria-hidden="true" className="text-ink">
                ✦
              </span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        <p className="text-[15px] text-ink-muted">
          Already have an account?{" "}
          <Link href="/login" className="underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>

      <Block color="white" className="p-6 lg:p-10">
        <OtpForm intendedRole={intendedRole} next={next} askName />
      </Block>
    </div>
  );
}
