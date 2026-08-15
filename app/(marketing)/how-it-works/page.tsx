import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";
import { Eyebrow, MixedHeadline } from "@/components/marketing/mixed-headline";
import { Reveal } from "@/components/marketing/reveal";
import { StudentsNeverPayNote } from "@/components/marketing/fee-display";
import { Block } from "@/components/ui/block";
import { ButtonLink } from "@/components/ui/button";
import {
  JUDGING_CRITERIA,
  VERIFICATION_STEPS,
  NON_WINNER_BENEFITS,
} from "@/lib/content";

export const metadata: Metadata = {
  title: "How verification works",
  description:
    "Four checks every FreshPools candidate clears: building under pressure, a git history review, a human code review, and a recorded viva. The rubric is public.",
};

/** What a company actually receives — the counterpart to the four checks. */
const WHAT_COMPANIES_GET = [
  {
    heading: "A demo video",
    body: "Ten minutes of the candidate explaining their own architecture and defending their choices. Watch it before you spend an hour on a call.",
  },
  {
    heading: "A public repository",
    body: "The actual code, with its commit history intact. Read it yourself — we are not asking you to take our word for anything.",
  },
  {
    heading: "Our written review note",
    body: "What we found reading the code: structure, error handling, tests, and where it falls short. Honest, not promotional.",
  },
  {
    heading: "The skills we observed",
    body: "Not what they listed on a CV — what they were seen using, under a deadline, on a real problem.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="How it works"
        headline="Four checks. **No shortcuts.**"
        sub="Every candidate we send to a company has cleared all four. A profile that skipped any one of them does not reach the talent pool."
        aside={
          <div>
            <ButtonLink href="/for-companies">Post a requirement</ButtonLink>
          </div>
        }
      />

      {/* ── The four checks, in depth ───────────────────────────────────── */}
      <section className="section-y bg-paper" aria-labelledby="checks-title">
        <div className="container-x">
          <Eyebrow className="mb-6">The process</Eyebrow>
          <MixedHeadline
            id="checks-title"
            text="What each check **actually catches.**"
            as="h2"
            size="h2"
            className="mb-16 max-w-[18ch]"
          />

          <ol className="flex flex-col gap-5">
            {VERIFICATION_STEPS.map((step, index) => (
              <Reveal key={step.heading} delay={index * 0.05}>
                <Block
                  as="li"
                  color={index === 3 ? "yellow" : "white"}
                  className="grid gap-6 p-8 lg:grid-cols-[auto_1fr_1.2fr] lg:items-start lg:gap-12 lg:p-10"
                >
                  {/* A real sequence, so the numbering carries information. */}
                  <span className="mono text-[40px] leading-none text-ink-muted/50 tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div>
                    <h3 className="font-sans text-[26px] leading-tight font-bold tracking-[-0.02em]">
                      {step.heading}
                    </h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
                      {step.body}
                    </p>
                  </div>

                  <p className="hl-serif text-[19px] leading-relaxed lg:text-[21px]">
                    {
                      [
                        "A take-home can be polished for a week, or done by someone else. A fixed deadline on a problem nobody has seen before cannot.",
                        "Work spread across the event looks nothing like one commit dumped at the deadline. The log is the part that is hardest to fake.",
                        "Output tells you it runs. Reading the code tells you whether the next person can change it without breaking it.",
                        "This is the check a resume can never survive. If they cannot explain their own architecture, nothing else on the profile counts.",
                      ][index]
                    }
                  </p>
                </Block>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Public rubric ───────────────────────────────────────────────── */}
      <section
        className="section-y border-y border-line-soft wash-soft"
        aria-labelledby="rubric-title"
      >
        <div className="container-x grid gap-12 lg:grid-cols-[2fr_3fr] lg:gap-20">
          <div className="flex flex-col gap-6">
            <Eyebrow>The rubric</Eyebrow>
            <MixedHeadline
              id="rubric-title"
              text="Published **before** anyone writes a line."
              as="h2"
              size="h2"
            />
            <p className="max-w-md text-body-lg text-ink-muted">
              Participants know exactly what they are marked on. Scoring is per
              person, not per team — hackathons hide passengers, and the viva is
              where that gets tested.
            </p>
            <p className="text-[15px] text-ink-muted">
              Only rank is published. The underlying numbers stay between us and
              the candidate.
            </p>
          </div>

          <Block color="white" className="overflow-hidden p-0">
            <ul>
              {JUDGING_CRITERIA.map((criterion) => (
                <li
                  key={criterion.label}
                  className="flex flex-col gap-3 border-b border-line-soft p-6 last:border-b-0 lg:p-8"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="font-sans text-[19px] font-medium">
                      {criterion.label}
                    </p>
                    <p className="mono text-label tabular-nums">{criterion.weight}%</p>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-sky-100"
                    aria-hidden="true"
                  >
                    <div
                      className="h-full rounded-full bg-ink"
                      style={{ width: `${criterion.weight}%` }}
                    />
                  </div>
                  <p className="text-[14px] text-ink-muted">{criterion.note}</p>
                </li>
              ))}
            </ul>
          </Block>
        </div>
      </section>

      {/* ── What a company receives ─────────────────────────────────────── */}
      <section className="section-y bg-paper" aria-labelledby="receive-title">
        <div className="container-x">
          <Eyebrow className="mb-6">For companies</Eyebrow>
          <MixedHeadline
            id="receive-title"
            text="What lands in **your shortlist.**"
            as="h2"
            size="h2"
            className="mb-14 max-w-[16ch]"
          />

          <div className="grid gap-5 sm:grid-cols-2">
            {WHAT_COMPANIES_GET.map((item, index) => (
              <Reveal key={item.heading} delay={index * 0.05}>
                <Block color="white" className="h-full p-8">
                  <h3 className="font-sans text-[22px] leading-tight font-bold tracking-[-0.02em]">
                    {item.heading}
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
                    {item.body}
                  </p>
                </Block>
              </Reveal>
            ))}
          </div>

          <Block color="coral" className="mt-5 p-8">
            <p className="mono mb-3 text-eyebrow">✦ What you never receive</p>
            <p className="max-w-3xl text-body-lg">
              <span className="hl-sans">
                A candidate&apos;s email or phone number.
              </span>{" "}
              <span className="hl-serif">
                Every introduction is brokered by us with their consent first.
                It protects them from being spammed and keeps the process
                accountable in both directions.
              </span>
            </p>
          </Block>
        </div>
      </section>

      {/* ── What a candidate keeps ──────────────────────────────────────── */}
      <section
        className="section-y border-t border-line-soft wash-soft"
        aria-labelledby="keep-title"
      >
        <div className="container-x">
          <Eyebrow className="mb-6">For students</Eyebrow>
          <MixedHeadline
            id="keep-title"
            text="Most people don't win. **They still leave with this.**"
            as="h2"
            size="h2"
            className="mb-14 max-w-[20ch]"
          />

          <div className="grid gap-5 lg:grid-cols-3">
            {NON_WINNER_BENEFITS.map((benefit, index) => (
              <Reveal key={benefit.heading} delay={index * 0.05}>
                <Block color="white" className="h-full p-8">
                  <h3 className="font-sans text-[22px] leading-tight font-bold tracking-[-0.02em]">
                    {benefit.heading}
                  </h3>
                  <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
                    {benefit.body}
                  </p>
                </Block>
              </Reveal>
            ))}
          </div>

          <div className="mt-10">
            <StudentsNeverPayNote />
          </div>
        </div>
      </section>

      <section className="border-t border-line-soft bg-block-ink text-white">
        <div className="container-x flex flex-col items-start gap-8 py-20 lg:flex-row lg:items-center lg:justify-between lg:py-24">
          <MixedHeadline
            text="Seen enough? **Tell us the role.**"
            as="h2"
            size="h2"
            className="max-w-[16ch] text-white"
          />
          <div className="flex shrink-0 flex-col gap-4">
            <ButtonLink href="/for-companies" variant="inverse">
              Post a requirement
            </ButtonLink>
            <p className="mono text-eyebrow text-white/70">
              You pay only when a hire clears 90 days
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
