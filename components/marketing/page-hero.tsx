import type { ReactNode } from "react";
import { Eyebrow, MixedHeadline } from "./mixed-headline";
import { cn } from "@/lib/utils";

/**
 * Shared header for the marketing subpages.
 *
 * Every one of these previously repeated `py-20 lg:py-28` with a narrow
 * headline column, which left a tall empty band and an empty right half. Here
 * the headline and the standfirst sit side by side and the vertical padding is
 * tighter — a page header is not the landing hero and should not pretend to be.
 */
export function PageHero({
  eyebrow,
  headline,
  sub,
  aside,
  headlineClassName,
}: {
  eyebrow: string;
  headline: string;
  sub?: string;
  /** Optional trailing content, e.g. a CTA. Sits under the standfirst. */
  aside?: ReactNode;
  headlineClassName?: string;
}) {
  return (
    <section className="border-b border-ink bg-sky">
      <div className="container-x py-14 lg:py-20">
        <Eyebrow className="mb-6">{eyebrow}</Eyebrow>

        <div className="grid gap-8 lg:grid-cols-[3fr_2fr] lg:items-end lg:gap-16">
          {/* min-w-0 so a long unbreakable word can never push into the
              standfirst column instead of overflowing its own. */}
          <MixedHeadline
            text={headline}
            as="h1"
            size="h1"
            className={cn("min-w-0 max-w-[18ch]", headlineClassName)}
          />

          {sub || aside ? (
            <div className="flex flex-col gap-6 lg:pb-2">
              {sub ? <p className="text-body-lg text-ink-muted">{sub}</p> : null}
              {aside}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
