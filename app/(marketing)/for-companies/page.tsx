import type { Metadata } from "next";
import { Eyebrow, MixedHeadline } from "@/components/marketing/mixed-headline";
import { PageHero } from "@/components/marketing/page-hero";
import { Faq } from "@/components/marketing/faq";
import { Reveal } from "@/components/marketing/reveal";
import { RequirementForm } from "@/components/forms/requirement-form";
import { FeatureCard, Block, blockAt } from "@/components/ui/block";
import { ButtonLink } from "@/components/ui/button";
import { COMPANY_FAQ, VERIFICATION_STEPS } from "@/lib/content";

export const metadata: Metadata = {
  title: "For companies",
  description:
    "Post a requirement and get a shortlist of freshers whose code we have read and whose demo we have watched. You pay only when a hire clears 90 days.",
};

export default function ForCompaniesPage() {
  return (
    <>
      <PageHero
        eyebrow="For companies"
        headline="Stop screening. **Start interviewing.**"
        sub="Tell us the role once. We come back with a short list of freshers who have already shipped working code under a deadline, had that code read by a human, and defended it on camera."
        aside={
          <div>
            <ButtonLink href="#requirement">Post a requirement</ButtonLink>
          </div>
        }
      />

      {/* ── How verification works ─────────────────────────────────────────── */}
      <section
        id="verification"
        className="section-y bg-paper"
        aria-labelledby="verification-title"
      >
        <div className="container-x">
          <Eyebrow className="mb-6">How verification works</Eyebrow>
          <MixedHeadline
            id="verification-title"
            text="Four checks before a name **reaches you.**"
            as="h2"
            size="h2"
            className="mb-12 max-w-[18ch]"
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VERIFICATION_STEPS.map((step, index) => (
              <Reveal key={step.heading} delay={index * 0.06}>
                <FeatureCard
                  color={blockAt(index)}
                  index={index + 1}
                  icon={<span className="text-xl">{step.icon}</span>}
                  heading={step.heading}
                  body={step.body}
                  className="h-full border-0"
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Requirement form ───────────────────────────────────────────────── */}
      <section
        id="requirement"
        className="section-y border-t border-line-soft wash-soft"
        aria-labelledby="requirement-title"
      >
        <div className="container-x grid gap-12 lg:grid-cols-[2fr_3fr] lg:gap-16">
          <div className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
            <Eyebrow>Post a requirement</Eyebrow>
            <MixedHeadline
              id="requirement-title"
              text="One form. **Seven days.**"
              as="h2"
              size="h2"
            />
            <p className="max-w-md text-body-lg text-ink-muted">
              No account, no demo call, no procurement process to start. Fill this
              in and we go looking.
            </p>
            <Block color="blue" className="p-6">
              <p className="mono mb-3 text-eyebrow">What you get back</p>
              <ul className="flex flex-col gap-2 text-[15px]">
                {[
                  "A demo video for every profile",
                  "A public repository you can read",
                  "Our written code-review note",
                  "The skills we actually observed",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span aria-hidden="true">✦</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Block>
          </div>

          <RequirementForm />
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <section
        id="pricing"
        className="section-y border-t border-line-soft bg-paper"
        aria-labelledby="pricing-title"
      >
        <div className="container-x">
          <Eyebrow className="mb-6">Fee structure</Eyebrow>
          <MixedHeadline
            id="pricing-title"
            text="You pay only when a hire **clears 90 days.**"
            as="h2"
            size="h2"
            className="mb-12 max-w-[18ch]"
          />

          <div className="grid gap-5 lg:grid-cols-3">
            {[
              {
                heading: "Nothing to start",
                body: "No listing fee, no subscription, no charge for viewing profiles or requesting an introduction. Post as many requirements as you have roles.",
              },
              {
                heading: "A percentage of first-year CTC",
                body: "Agreed in writing before we introduce anyone, so there is never a surprise invoice. The rate is the same whoever you hire from the shortlist.",
              },
              {
                heading: "Invoiced after 90 days",
                body: "The clock starts on the joining date. If the hire does not last 90 days, no fee is due — we would rather fix the match than argue about an invoice.",
              },
            ].map((item, index) => (
              <Block key={item.heading} color={blockAt(index)} className="h-full p-8">
                <h3 className="font-sans text-[24px] leading-tight font-bold tracking-[-0.02em]">
                  {item.heading}
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
                  {item.body}
                </p>
              </Block>
            ))}
          </div>

          <Block color="white" className="mt-8 p-8">
            <p className="mono mb-3 text-eyebrow">✦ One more thing</p>
            <p className="max-w-3xl text-body-lg">
              <span className="hl-serif">
                Candidate contact details are never in the profile you browse.
                Every introduction is brokered by us with the candidate&apos;s
                consent —
              </span>{" "}
              <span className="hl-sans">
                that protects them from spam and keeps the process accountable
                both ways.
              </span>
            </p>
          </Block>
        </div>
      </section>

      <Faq
        items={COMPANY_FAQ}
        eyebrow="Company questions"
        headline="The things **procurement asks.**"
      />
    </>
  );
}
