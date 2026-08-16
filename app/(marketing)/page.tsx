import Link from "next/link";
import { Hero } from "@/components/marketing/hero";
import { DashboardMockup } from "@/components/marketing/dashboard-mockup";
import { LogoMarquee } from "@/components/marketing/logo-marquee";
import { RoleDoors } from "@/components/marketing/role-doors";
import { Faq } from "@/components/marketing/faq";
import { Reveal } from "@/components/marketing/reveal";
import { Eyebrow, MixedHeadline, SectionHeader } from "@/components/marketing/mixed-headline";
import { FeatureCard, StatBlock, Block, blockAt } from "@/components/ui/block";
import { StatusBadge } from "@/components/ui/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { LANDING_FAQ, PROBLEM_STATS, VERIFICATION_STEPS } from "@/lib/content";
import {
  getHiringPartners,
  getSampleProfiles,
  getVerifiedCandidateCount,
  getVerifiedNames,
} from "@/lib/queries";

export default async function LandingPage() {
  // Fetched in parallel — none of these depend on each other.
  const [verifiedCount, verifiedNames, partners, sampleProfiles] =
    await Promise.all([
      getVerifiedCandidateCount(),
      getVerifiedNames(4),
      getHiringPartners(),
      getSampleProfiles(3),
    ]);

  return (
    <>
      <Hero verifiedCount={verifiedCount} verifiedNames={verifiedNames} />

      <RoleDoors />

      {/* ── Dashboard mockup: half-cropped, overlapping the section boundary ── */}
      <section aria-hidden="false" className="relative bg-paper">
        <div className="container-x">
          <div className="-mb-24 lg:-mb-32">
            <DashboardMockup />
          </div>
        </div>
        {/* The lower half of the frame sits on paper, so the mockup straddles
            the boundary between the two surfaces. */}
        <div className="h-24 bg-paper lg:h-32" />
      </section>

      <LogoMarquee partners={partners} eyebrow="Hiring partners" />

      {/* ── Problem ────────────────────────────────────────────────────────── */}
      <section className="section-y bg-paper" aria-labelledby="problem-title">
        <div className="container-x">
          <Reveal>
            <SectionHeader
              headingId="problem-title"
              eyebrow="The screening problem"
              headline="Not another resume pile. **A verified shortlist.**"
              sub="Fresher hiring breaks at the same place every time: a stack of near-identical CVs, and no way to tell who can actually build. So we stopped reading CVs and started reading code."
            >
              <div className="grid gap-5 sm:grid-cols-3">
                {PROBLEM_STATS.map((stat, index) => (
                  <StatBlock
                    key={stat.value}
                    color={index === 1 ? "white" : blockAt(index)}
                    value={stat.value}
                    label={stat.label}
                    source={stat.source}
                  />
                ))}
              </div>
            </SectionHeader>
          </Reveal>
        </div>
      </section>

      {/* ── How verification works ─────────────────────────────────────────── */}
      <section className="section-y border-y border-line-soft wash-soft" aria-labelledby="verify-title">
        <div className="container-x">
          <Reveal>
            <div className="flex flex-col gap-6">
              <Eyebrow>How verification works</Eyebrow>
              <MixedHeadline
                id="verify-title"
                text="Four checks. **No shortcuts.**"
                as="h2"
                size="h2"
                className="max-w-[16ch]"
              />
              <p className="max-w-2xl text-body-lg text-ink-muted">
                Every candidate we send you has been through all four. A profile
                that skipped any one of them does not reach the talent pool.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VERIFICATION_STEPS.map((step, index) => (
              <Reveal key={step.heading} delay={index * 0.06}>
                <FeatureCard
                  color={blockAt(index)}
                  /* A real sequence — numbering is justified here. */
                  index={index + 1}
                  icon={<span className="text-xl">{step.icon}</span>}
                  heading={step.heading}
                  body={step.body}
                  className="h-full"
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sample profiles ────────────────────────────────────────────────── */}
      {sampleProfiles.length > 0 ? (
        <section className="section-y bg-paper" aria-labelledby="profiles-title">
          <div className="container-x">
            <Reveal>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-col gap-6">
                  <Eyebrow>From the pool</Eyebrow>
                  <MixedHeadline
                    id="profiles-title"
                    text="Real profiles, **already reviewed.**"
                    as="h2"
                    size="h2"
                    className="max-w-[14ch]"
                  />
                </div>
                <p className="max-w-sm text-[15px] text-ink-muted">
                  Names and contact details stay hidden until you request an
                  introduction. Every introduction goes through us, with the
                  candidate&apos;s consent.
                </p>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sampleProfiles.map((profile, index) => (
                <Reveal key={profile.id} delay={index * 0.06}>
                  <Block
                    color={blockAt(index)}
                    className="flex h-full flex-col gap-5 p-8"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-sans text-[22px] font-bold tracking-[-0.02em]">
                          {profile.maskedName}
                        </p>
                        <p className="mono mt-1 text-eyebrow text-ink-muted">
                          {profile.college} · {profile.gradYear}
                        </p>
                      </div>
                      {profile.tier ? (
                        <StatusBadge tone="done">Tier {profile.tier}</StatusBadge>
                      ) : null}
                    </div>

                    <ul className="flex flex-wrap gap-2">
                      {profile.skills.map((skill) => (
                        <li
                          key={skill}
                          className="mono rounded-sm border border-line-mid px-2 py-1 text-eyebrow"
                        >
                          {skill}
                        </li>
                      ))}
                    </ul>

                    <Link
                      href="/login"
                      className="mono group/link mt-auto inline-flex items-center gap-2 text-label underline underline-offset-4"
                    >
                      Watch demo
                      <span
                        aria-hidden="true"
                        className="transition-transform duration-200 group-hover/link:translate-x-1"
                      >
                        →
                      </span>
                    </Link>
                  </Block>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <Faq items={LANDING_FAQ} />

      {/* ── Final CTA: full-bleed ink block ────────────────────────────────── */}
      <section className="border-t border-ink bg-block-ink text-white">
        <div className="container-x flex flex-col items-start gap-10 py-20 lg:flex-row lg:items-center lg:justify-between lg:py-28">
          <MixedHeadline
            text="Tell us what you need. **We'll send the shortlist.**"
            as="h2"
            size="h2"
            className="max-w-[18ch] text-white"
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
