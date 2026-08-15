import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";
import { Block } from "@/components/ui/block";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "Event entry and refunds, how company placement fees work, and the rules for participating.",
};

/** Same principle as the privacy stub: only what the product actually does. */
const SECTIONS = [
  {
    heading: "Event entry and refunds",
    body: "Entry to an event costs the fee shown on that event's page. A stated portion is refunded once an organiser verifies you checked in and attended. Refunds are issued to the original payment method and typically take 5–7 working days. Entry is free where an event is marked as sponsored.",
  },
  {
    heading: "Students never pay for placement",
    body: "The entry fee covers event logistics only — venue, internet, food and the prize pool. FreshPools does not charge students for placement, for a shortlist position, or for an introduction. There is no paid tier and no way to buy a better rank.",
  },
  {
    heading: "Participation rules",
    body: "Teams are sized as stated on the event page. Projects must be started after kickoff, the repository must be public through judging, and the recorded viva is compulsory — a submission without one is not scored. Libraries and AI assistants are permitted; you must still be able to explain every line.",
  },
  {
    heading: "Company placement fees",
    body: "Companies pay a percentage of first-year CTC, agreed in writing before any introduction is made, and invoiced only after a hire completes 90 days. If the hire does not complete 90 days, no fee is due. There is no listing fee and no subscription.",
  },
  {
    heading: "Scoring and results",
    body: "Scoring is per individual, not per team. Only rank is published; the underlying scores stay between FreshPools and the candidate. Tier assignment is at our discretion, based on reviewed work, and cannot be purchased or appealed for payment.",
  },
];

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Terms"
        headline="The rules, **stated plainly.**"
        sub="What you pay, what comes back, and what we expect from a participant."
      />

      <section className="section-y bg-paper">
        <div className="container-x max-w-3xl">
          <Block color="yellow" className="mb-10 p-6">
            <p className="mono mb-2 text-eyebrow">✦ Draft</p>
            <p className="text-[15px]">
              This states what the product actually does today. It has not been
              reviewed by a lawyer — add liability, governing law and dispute
              resolution before launch.
            </p>
          </Block>

          <div className="flex flex-col gap-10">
            {SECTIONS.map((section) => (
              <div key={section.heading}>
                <h2 className="font-sans text-[22px] leading-tight font-bold tracking-[-0.02em]">
                  {section.heading}
                </h2>
                <p className="mt-3 text-body-lg leading-relaxed text-ink-muted">
                  {section.body}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-12 text-[15px] text-ink-muted">
            Questions:{" "}
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
