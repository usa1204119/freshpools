import type { Metadata } from "next";
import { Eyebrow, MixedHeadline } from "@/components/marketing/mixed-headline";
import { Block, blockAt } from "@/components/ui/block";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Requirement received",
  robots: { index: false, follow: false },
};

const NEXT_STEPS = [
  {
    heading: "We read it properly",
    body: "A human goes through your requirement, not a keyword matcher. If something is ambiguous we will email you rather than guess.",
  },
  {
    heading: "We search the pool",
    body: "We look for candidates whose reviewed work actually resembles your stack and your problem — not just whoever listed the right keyword.",
  },
  {
    heading: "Profiles within 7 days",
    body: "Each with a demo video, a public repository and our review note. If we do not have a genuine match, we will tell you that instead of padding the list.",
  },
];

export default function RequirementThankYouPage() {
  return (
    <>
      <section className="border-b border-line-soft wash-soft">
        <div className="container-x py-20 lg:py-28">
          <Eyebrow className="mb-6">Requirement received</Eyebrow>
          <MixedHeadline
            text="Got it. **We're on it.**"
            as="h1"
            size="h1"
            className="max-w-[12ch]"
          />
          <p className="mt-8 max-w-2xl text-body-lg text-ink-muted">
            We&apos;ll send you matched profiles within 7 days. A confirmation is
            on its way to the email address you gave us.
          </p>
        </div>
      </section>

      <section className="section-y bg-paper">
        <div className="container-x">
          <div className="grid gap-5 lg:grid-cols-3">
            {NEXT_STEPS.map((step, index) => (
              <Block key={step.heading} color={blockAt(index)} className="h-full p-8">
                <p className="mono text-eyebrow text-ink-muted">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-3 font-sans text-[24px] leading-tight font-bold tracking-[-0.02em]">
                  {step.heading}
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
                  {step.body}
                </p>
              </Block>
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <ButtonLink href="/hackathons" variant="secondary">
              See upcoming events
            </ButtonLink>
            <ButtonLink href="/">Back to home</ButtonLink>
          </div>

          <p className="mt-10 text-[15px] text-ink-muted">
            Something urgent, or a correction to send?{" "}
            <a
              href="mailto:hello@freshpools.in"
              className="underline underline-offset-4"
            >
              hello@freshpools.in
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
