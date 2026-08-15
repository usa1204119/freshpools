import type { Metadata } from "next";
import { Eyebrow, MixedHeadline } from "@/components/marketing/mixed-headline";
import { PageHero } from "@/components/marketing/page-hero";
import { StudentsNeverPayNote } from "@/components/marketing/fee-display";
import { Block, blockAt } from "@/components/ui/block";
import { ButtonLink } from "@/components/ui/button";
import { JUDGING_CRITERIA, POSITIONING } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why FreshPools exists, how verification works, how we make money, and the rules we hold ourselves to.",
};

const PRINCIPLES = [
  {
    heading: "Evidence over claims",
    body: "A CV is a claim. A public repository, a commit history, a demo video and a recorded viva are evidence. We only pass on evidence.",
  },
  {
    heading: "Candidates are not the product",
    body: "Students never pay us for placement or a shortlist position. There is no paid tier and no way to buy a better rank. Companies pay, and only after a hire lasts.",
  },
  {
    heading: "Individuals, not teams",
    body: "Hackathons hide passengers. We score every participant separately on their own contribution, and the viva is where that gets tested.",
  },
  {
    heading: "The rubric is public",
    body: "Every participant knows the weightings before they write a line of code. Nothing about how we judge is a secret.",
  },
  {
    heading: "Introductions are brokered",
    body: "A company never sees a candidate's email or phone number in a profile. Every introduction goes through us, with consent, and every one is logged.",
  },
  {
    heading: "We say no",
    body: "If we do not have a genuine match for a requirement, we say so. A padded shortlist costs a company more than an empty one.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        headline="Verified fresher talent, proven through **competitive nature.**"
        sub="FreshPools runs competitive coding events, verifies what participants actually built, and sends companies a shortlist instead of a pile."
      />

      {/* ── Why ────────────────────────────────────────────────────────────── */}
      <section className="section-y bg-paper" aria-labelledby="why-title">
        <div className="container-x grid gap-10 lg:grid-cols-[2fr_3fr] lg:gap-16">
          <div className="flex flex-col gap-6">
            <Eyebrow>Why this exists</Eyebrow>
            <MixedHeadline
              id="why-title"
              text="Fresher hiring breaks in the **same place** every time."
              as="h2"
              size="h2"
            />
          </div>
          <div className="flex max-w-prose flex-col gap-5 text-body-lg text-ink-muted">
            <p>
              A company opens one fresher role and receives several hundred
              applications that look identical. The CVs list the same courses, the
              same cloned projects, and the same certifications. Nothing in that
              pile distinguishes someone who can build from someone who can
              describe building.
            </p>
            <p>
              So companies fall back on college tier and CGPA, which are weak
              proxies, and good students from unfashionable colleges never get
              read. Everyone loses time, and the people who lose most are the ones
              with the least leverage.
            </p>
            <p>
              <span className="hl-sans text-ink">
                The fix is not another filter. It is evidence.
              </span>{" "}
              Put people in a room with a real problem and a deadline, watch what
              they ship, read the code, and make them explain it. What comes out
              the other side is a shortlist a hiring manager can actually trust.
            </p>
          </div>
        </div>
      </section>

      {/* ── Principles ─────────────────────────────────────────────────────── */}
      <section className="section-y border-y border-ink bg-sky" aria-labelledby="principles-title">
        <div className="container-x">
          <Eyebrow className="mb-6">How we operate</Eyebrow>
          <MixedHeadline
            id="principles-title"
            text="Six rules we **don't bend.**"
            as="h2"
            size="h2"
            className="mb-12 max-w-[14ch]"
          />
          <div className="grid gap-px border border-ink bg-ink sm:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map((principle, index) => (
              <Block key={principle.heading} color={blockAt(index)} className="border-0 p-8">
                <h3 className="font-sans text-[22px] leading-tight font-bold tracking-[-0.02em]">
                  {principle.heading}
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
                  {principle.body}
                </p>
              </Block>
            ))}
          </div>
        </div>
      </section>

      {/* ── Scoring ────────────────────────────────────────────────────────── */}
      <section className="section-y bg-paper" aria-labelledby="scoring-title">
        <div className="container-x grid gap-10 lg:grid-cols-[2fr_3fr] lg:gap-16">
          <div className="flex flex-col gap-6">
            <Eyebrow>Scoring</Eyebrow>
            <MixedHeadline
              id="scoring-title"
              text="The same rubric, **every event.**"
              as="h2"
              size="h2"
            />
            <p className="max-w-md text-body-lg text-ink-muted">
              Scored per person. Published as rank only — the underlying numbers
              stay between us and the candidate.
            </p>
          </div>
          <ul className="border border-ink bg-block-white">
            {JUDGING_CRITERIA.map((criterion) => (
              <li
                key={criterion.label}
                className="flex flex-col gap-3 border-b border-ink p-6 last:border-b-0"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <p className="font-sans text-[18px] font-medium">{criterion.label}</p>
                  <p className="mono text-label">{criterion.weight}%</p>
                </div>
                <div className="h-2 border border-ink" aria-hidden="true">
                  <div className="h-full bg-ink" style={{ width: `${criterion.weight}%` }} />
                </div>
                <p className="text-[14px] text-ink-muted">{criterion.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Money ──────────────────────────────────────────────────────────── */}
      <section id="fees" className="section-y border-t border-ink bg-sky" aria-labelledby="money-title">
        <div className="container-x">
          <Eyebrow className="mb-6">Money</Eyebrow>
          <MixedHeadline
            id="money-title"
            text="Who pays us, and **for what.**"
            as="h2"
            size="h2"
            className="mb-12 max-w-[14ch]"
          />

          <div className="grid gap-px border border-ink bg-ink lg:grid-cols-3">
            {[
              {
                who: "Companies",
                what: "A placement fee, a percentage of first-year CTC, invoiced only after a hire clears 90 days. Some also sponsor events, which makes entry free for students.",
              },
              {
                who: "Colleges",
                what: "Nothing for a hackathon — those are sponsor-funded. Colleges pay only if they book the optional two-day workshop.",
              },
              {
                who: "Students",
                what: "A small event entry fee, half of it refunded on check-in, covering logistics only. Never a rupee for placement, shortlisting, or a better rank.",
              },
            ].map((row, index) => (
              <Block key={row.who} color={blockAt(index)} className="border-0 p-8">
                <p className="mono text-eyebrow text-ink-muted">{row.who}</p>
                <p className="mt-4 text-[16px] leading-relaxed">{row.what}</p>
              </Block>
            ))}
          </div>

          <div className="mt-8">
            <StudentsNeverPayNote />
          </div>
        </div>
      </section>

      <section className="border-t border-ink bg-block-ink text-white">
        <div className="container-x flex flex-col items-start gap-8 py-20 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mono mb-4 text-eyebrow text-white/70">{POSITIONING}</p>
            <MixedHeadline
              text="Hiring, or **hosting?**"
              as="h2"
              size="h2"
              className="max-w-[14ch] text-white"
            />
          </div>
          <div className="flex shrink-0 flex-col gap-4 sm:flex-row">
            <ButtonLink href="/for-companies" variant="inverse">
              Post a requirement
            </ButtonLink>
            <ButtonLink
              href="/for-colleges"
              className="border-white bg-transparent text-white hover:bg-white hover:text-ink"
            >
              Host an event
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
