import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";
import { Block } from "@/components/ui/block";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What FreshPools collects, who can see it, and what is never shared with a hiring company.",
};

/**
 * Placeholder with the parts we can state accurately today, because they are
 * enforced in code. Everything a lawyer needs to add is flagged rather than
 * invented — a privacy policy that describes behaviour we do not have would be
 * worse than none.
 */
const SECTIONS = [
  {
    heading: "What we collect",
    body: "For candidates: name, email, phone, college, graduation year, skills, and the links you give us — GitHub, LinkedIn, resume, demo video. For companies: your name, work email, phone, and the requirements you post. For colleges: the contact details on your enquiry.",
  },
  {
    heading: "What a company can see about you",
    body: "Your masked name, an anonymous handle, your college, graduation year, skills, tier, demo video, public repository and our written review note. Your email address, phone number and our internal admin notes are never included — this is enforced at the database query level, not by policy alone.",
  },
  {
    heading: "How introductions work",
    body: "A company can ask to be introduced to you. We ask you first. Your contact details are passed on only after you agree, and every introduction is logged with a date.",
  },
  {
    heading: "Payments",
    body: "Event entry fees are processed by Razorpay. We store the Razorpay order and payment identifiers and the amount — never your card details, which we never receive.",
  },
  {
    heading: "Your choices",
    body: "You can edit or remove anything on your profile, set yourself unavailable, or ask us to delete your account entirely by writing to hello@freshpools.in.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Privacy"
        headline="What we hold, and **who can see it.**"
        sub="Plain language, no defensive hedging. The important rule: a hiring company never receives your contact details without your explicit yes."
      />

      <section className="section-y bg-paper">
        <div className="container-x max-w-3xl">
          <Block color="yellow" className="mb-10 p-6">
            <p className="mono mb-2 text-eyebrow">✦ Draft</p>
            <p className="text-[15px]">
              This states what the product actually does today. It has not been
              reviewed by a lawyer and is not yet a complete privacy policy —
              add retention periods, jurisdiction and a grievance officer before
              launch.
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
            Questions about any of this:{" "}
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
