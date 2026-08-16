import { Eyebrow, MixedHeadline } from "./mixed-headline";
import { BackgroundArt } from "./background-art";
import { SocialProof } from "./social-proof";
import { ButtonLink } from "@/components/ui/button";
import { HERO } from "@/lib/content";

/**
 * The hero's single job is to get a company to the requirement form.
 *
 * v3: centred, on a gradient wash with faint geometry behind it. The v2 hero
 * was left-aligned on flat colour, which left the right half of wide screens
 * empty and reading as unfinished rather than spacious.
 *
 * Both proof elements below the buttons are conditional — a zero here would
 * actively damage the pitch, and an invented number would be worse
 * (NON-NEGOTIABLE #12).
 */
export function Hero({
  verifiedCount,
  verifiedNames,
}: {
  verifiedCount: number;
  verifiedNames: string[];
}) {
  return (
    <section className="wash-hero relative isolate overflow-hidden">
      <BackgroundArt />

      {/* Deliberately short of a full viewport: the role doors directly below
          must peek above the fold, or a student still lands on a company pitch
          and has to guess that scrolling helps. */}
      <div className="container-x relative flex min-h-[calc(74svh-5rem)] flex-col items-center justify-center py-10 text-center lg:py-12">
        <div data-rise="" className="rise mb-6">
          <Eyebrow>Verified fresher talent</Eyebrow>
        </div>

        <MixedHeadline
          text={HERO.headline}
          as="h1"
          size="h1"
          stagger
          className="max-w-[15ch]"
        />

        <p
          data-rise=""
          className="rise mt-6 max-w-2xl text-body-lg text-ink-muted"
          style={{ animationDelay: "180ms" }}
        >
          {HERO.sub}
        </p>

        <div
          data-rise=""
          className="rise mt-8 flex flex-col gap-4 sm:flex-row sm:items-center"
          style={{ animationDelay: "240ms" }}
        >
          <ButtonLink href="/for-companies" size="lg">
            Post a requirement
          </ButtonLink>
          <ButtonLink href="/how-it-works" variant="secondary" size="lg">
            How it works
          </ButtonLink>
        </div>

        {verifiedCount > 0 ? (
          <div data-rise="" className="rise mt-8" style={{ animationDelay: "300ms" }}>
            <SocialProof
              names={verifiedNames}
              total={verifiedCount}
              caption={`${verifiedCount} verified this season`}
              className="justify-center"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
