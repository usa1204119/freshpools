import type { Metadata } from "next";
import { Eyebrow, MixedHeadline } from "@/components/marketing/mixed-headline";
import { Block, blockAt } from "@/components/ui/block";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Enquiry received",
  robots: { index: false, follow: false },
};

export default function CollegeThankYouPage() {
  return (
    <>
      <section className="border-b border-line-soft wash-soft">
        <div className="container-x py-20 lg:py-28">
          <Eyebrow className="mb-6">Enquiry received</Eyebrow>
          <MixedHeadline
            text="Thanks. **We'll be in touch.**"
            as="h1"
            size="h1"
            className="max-w-[14ch]"
          />
          <p className="mt-8 max-w-2xl text-body-lg text-ink-muted">
            We reply within three working days with what a run on your campus
            would involve — dates, what we need from you, and what your students
            walk away with.
          </p>
        </div>
      </section>

      <section className="section-y bg-paper">
        <div className="container-x">
          <div className="grid gap-5 lg:grid-cols-3">
            {[
              {
                heading: "A short call",
                body: "Twenty minutes with you and whoever owns placements, to check dates against your academic calendar.",
              },
              {
                heading: "A written plan",
                body: "What we run, what the college provides, and what the sponsoring company brings. Nothing verbal.",
              },
              {
                heading: "Dates locked",
                body: "We avoid your exam weeks. August–September and January are usually the cleanest windows.",
              },
            ].map((step, index) => (
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
              See past events
            </ButtonLink>
            <ButtonLink href="/">Back to home</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
