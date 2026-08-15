import { Eyebrow, MixedHeadline } from "./mixed-headline";
import { ButtonLink } from "@/components/ui/button";
import { HERO } from "@/lib/content";

/**
 * The hero's single job is to get a company to the requirement form.
 *
 * Composition notes: the headline runs to near the full container measure
 * rather than being boxed into a narrow column — at 88px a 16ch cap wrapped it
 * to four lines and left the right half of the screen empty. The lower row is
 * a two-column split so the copy and the standing "no risk" claim share the
 * width instead of stacking into more dead space.
 *
 * The "VERIFIED THIS SEASON" line is conditional: it renders only when the
 * count is real and non-zero. A zero here would actively damage the pitch, and
 * a made-up number would be worse (NON-NEGOTIABLE #12).
 */
export function Hero({ verifiedCount }: { verifiedCount: number }) {
  return (
    <section className="border-b border-ink bg-sky">
      <div className="container-x flex min-h-[calc(100svh-13rem)] flex-col justify-center py-14 lg:py-16">
        <div data-rise="" className="rise mb-8 lg:mb-10">
          <Eyebrow>Verified fresher talent</Eyebrow>
        </div>

        <MixedHeadline
          text={HERO.headline}
          as="h1"
          size="h1"
          stagger
          className="max-w-[min(100%,60rem)]"
        />

        <div className="mt-10 grid gap-8 border-t border-ink pt-8 lg:mt-14 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16 lg:pt-10">
          <div>
            <p
              data-rise=""
              className="rise max-w-2xl text-body-lg text-ink-muted"
              style={{ animationDelay: "180ms" }}
            >
              {HERO.sub}
            </p>

            <div
              data-rise=""
              className="rise mt-8 flex flex-col gap-4 sm:flex-row sm:items-center"
              style={{ animationDelay: "240ms" }}
            >
              <ButtonLink href="/for-companies">Post a requirement</ButtonLink>
              <ButtonLink href="/login" variant="secondary">
                Browse talent
              </ButtonLink>
            </div>

            {verifiedCount > 0 ? (
              <p
                data-rise=""
                className="mono rise mt-8 text-label text-ink-muted"
                style={{ animationDelay: "300ms" }}
              >
                Verified this season: {verifiedCount}{" "}
                {verifiedCount === 1 ? "candidate" : "candidates"}
              </p>
            ) : null}
          </div>

          {/* The strongest single line for a hiring company, given standing
              room rather than being buried in the footer CTA. Built as a stat
              block rather than a sentence: in a narrow column a mixed headline
              breaks mid-phrase, which is exactly what the design system is
              trying to avoid. */}
          <aside
            data-rise=""
            className="rise border border-ink bg-block-white p-6 lg:w-72"
            style={{ animationDelay: "300ms" }}
          >
            <p className="mono text-eyebrow text-ink-muted">✦ No risk to you</p>
            <p className="mt-4 font-sans text-[44px] leading-none font-bold tracking-[-0.03em]">
              90 days
            </p>
            <p className="mt-3 text-[15px] leading-snug">
              before we invoice you — and only if the hire is still there.
            </p>
            {/* Short enough to hold one line at 11px with 0.12em tracking in
                this column — a longer string orphans its last word. */}
            <p className="mono mt-4 border-t border-ink pt-3 text-eyebrow text-ink-muted">
              Nothing up front
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
