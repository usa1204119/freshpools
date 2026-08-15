import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, DASHBOARD_BY_ROLE } from "@/lib/auth";
import { OtpForm } from "@/components/forms/otp-form";
import { Eyebrow, MixedHeadline } from "@/components/marketing/mixed-headline";
import { Block } from "@/components/ui/block";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect(DASHBOARD_BY_ROLE[session.user.role]);

  const { next } = await searchParams;

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-2 lg:gap-16">
      <div className="flex flex-col gap-6">
        <Eyebrow>Sign in</Eyebrow>
        <MixedHeadline
          text="No password. **Just a code.**"
          as="h1"
          size="h2"
          className="max-w-[12ch]"
        />
        <p className="max-w-md text-body-lg text-ink-muted">
          Enter your email and we&apos;ll send a six-digit code. Same door for
          students, companies and organisers — we route you by your account.
        </p>
        <Block color="white" className="p-6">
          <p className="mono mb-2 text-eyebrow">New here?</p>
          <p className="text-[15px] text-ink-muted">
            Signing in with an unrecognised email creates a candidate account.
            Hiring instead?{" "}
            <Link href="/signup?role=company" className="underline underline-offset-4">
              Create a company account
            </Link>
            .
          </p>
        </Block>
      </div>

      <Block color="white" className="p-6 lg:p-10">
        <OtpForm next={next} />
      </Block>
    </div>
  );
}
