import type { Metadata } from "next";
import { Eyebrow, MixedHeadline } from "@/components/marketing/mixed-headline";
import { PageHero } from "@/components/marketing/page-hero";
import { Faq } from "@/components/marketing/faq";
import { Reveal } from "@/components/marketing/reveal";
import { CollegeEnquiryForm } from "@/components/forms/college-enquiry-form";
import { Block } from "@/components/ui/block";
import { ButtonLink } from "@/components/ui/button";
import { COLLEGE_FAQ, COLLEGE_OFFERINGS } from "@/lib/content";

export const metadata: Metadata = {
  title: "For colleges",
  description:
    "Host a sponsor-funded hackathon at zero cost to the college, or book a paid two-day bootcamp before it. Industry connect, placement pipeline, reportable numbers.",
};

export default function ForCollegesPage() {
  return (
    <>
      <PageHero
        eyebrow="For colleges"
        headline="Industry connect that ends in **actual introductions.**"
        sub="We bring a real company problem to your campus, run the event, review every submission, and hand your placement cell a list of students who can prove what they can build."
        aside={
          <div>
            <ButtonLink href="#enquiry">Start an enquiry</ButtonLink>
          </div>
        }
      />

      {/* ── Two offerings, side by side ────────────────────────────────────── */}
      <section className="section-y bg-paper" aria-labelledby="offerings-title">
        <div className="container-x">
          <Eyebrow className="mb-6">What we run</Eyebrow>
          <MixedHeadline
            id="offerings-title"
            text="Two things. **Take one or both.**"
            as="h2"
            size="h2"
            className="mb-12 max-w-[16ch]"
          />

          <div className="grid gap-px border border-ink bg-ink lg:grid-cols-2">
            {COLLEGE_OFFERINGS.map((offering, index) => (
              <Reveal key={offering.title} delay={index * 0.06}>
                <Block
                  color={offering.color}
                  className="flex h-full flex-col gap-6 border-0 p-8 lg:p-10"
                >
                  <p className="mono text-eyebrow text-ink-muted">
                    {offering.eyebrow}
                  </p>

                  <h3 className="font-sans text-[30px] leading-tight font-bold tracking-[-0.02em] lg:text-[36px]">
                    {offering.title}
                  </h3>

                  <div className="border-y border-ink py-4">
                    <p className="font-sans text-[22px] font-bold">{offering.price}</p>
                    <p className="mono mt-1 text-eyebrow text-ink-muted">
                      {offering.priceNote}
                    </p>
                  </div>

                  <ul className="flex flex-col gap-3">
                    {offering.points.map((point) => (
                      <li key={point} className="flex gap-3 text-[15px] leading-relaxed">
                        <span aria-hidden="true" className="mt-0.5 shrink-0">
                          ✦
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                  <ButtonLink
                    href="#enquiry"
                    variant="secondary"
                    size="sm"
                    className="mt-auto self-start"
                  >
                    Enquire about this
                  </ButtonLink>
                </Block>
              </Reveal>
            ))}
          </div>

          {/* Timing note */}
          <Block color="white" className="mt-8 p-8">
            <p className="mono mb-3 text-eyebrow">✦ On timing</p>
            <p className="max-w-3xl text-body-lg">
              <span className="hl-serif">
                We schedule around your academic calendar —
              </span>{" "}
              <span className="hl-sans">August–September and January work best.</span>{" "}
              <span className="hl-serif">
                Tell us your exam weeks and we will plan around them.
              </span>
            </p>
          </Block>
        </div>
      </section>

      {/* ── What the college actually gets ─────────────────────────────────── */}
      <section className="section-y border-y border-ink bg-sky" aria-labelledby="outcomes-title">
        <div className="container-x grid gap-10 lg:grid-cols-[2fr_3fr] lg:gap-16">
          <div className="flex flex-col gap-6">
            <Eyebrow>Outcomes</Eyebrow>
            <MixedHeadline
              id="outcomes-title"
              text="Numbers your TPO can **actually report.**"
              as="h2"
              size="h2"
            />
          </div>
          <ul className="border-t border-ink">
            {[
              {
                label: "Participation",
                value: "Headcount, teams formed, and submissions completed",
              },
              {
                label: "Verified profiles",
                value: "How many of your students left with a reviewed profile",
              },
              {
                label: "Company introductions",
                value: "Every intro that came out of your campus, logged and dated",
              },
              {
                label: "Industry contact",
                value: "The sponsoring company's mentors, on your floor, for the full event",
              },
            ].map((row) => (
              <li
                key={row.label}
                className="flex flex-col gap-1 border-b border-ink py-5 sm:flex-row sm:gap-8"
              >
                <span className="mono w-56 shrink-0 text-label text-ink-muted">
                  {row.label}
                </span>
                <span className="text-[16px]">{row.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Enquiry form ───────────────────────────────────────────────────── */}
      <section id="enquiry" className="section-y bg-paper" aria-labelledby="enquiry-title">
        <div className="container-x grid gap-12 lg:grid-cols-[2fr_3fr] lg:gap-16">
          <div className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
            <Eyebrow>Enquiry</Eyebrow>
            <MixedHeadline
              id="enquiry-title"
              text="Tell us about **your campus.**"
              as="h2"
              size="h2"
            />
            <p className="max-w-md text-body-lg text-ink-muted">
              A few details is enough to start. We reply within three working days
              with what a run on your campus would look like.
            </p>
            <Block color="coral" className="p-6">
              <p className="mono mb-3 text-eyebrow">Students never pay us</p>
              <p className="text-[15px] leading-relaxed">
                Event entry fees cover logistics only, half of it comes back on
                check-in, and FreshPools never charges a student for placement or
                shortlisting. Your students are not the product being sold.
              </p>
            </Block>
          </div>

          <CollegeEnquiryForm />
        </div>
      </section>

      <Faq
        items={COLLEGE_FAQ}
        eyebrow="College questions"
        headline="What the **placement cell asks.**"
      />
    </>
  );
}
