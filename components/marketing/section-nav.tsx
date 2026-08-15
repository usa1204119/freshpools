"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type SectionLink = { id: string; label: string };

/**
 * Sticky in-page index with scroll-spy.
 *
 * The event page carries thirteen sections and previously offered no way to
 * move between them — that, more than anything visual, is what made the site
 * feel hard to navigate.
 *
 * Deliberately a horizontal bar rather than the left-hand column in the spec:
 * a column would mean wrapping all thirteen sections in a two-column grid, and
 * the regression risk of that refactor outweighs the gain. A bar solves the
 * actual problem — finding and jumping to a section — at every breakpoint.
 */
export function SectionNav({
  sections,
  className,
}: {
  sections: SectionLink[];
  className?: string;
}) {
  const [active, setActive] = useState<string | null>(sections[0]?.id ?? null);

  useEffect(() => {
    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    // rootMargin biases "current" toward the upper third of the viewport,
    // which is where a reader's attention actually sits.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: "-104px 0px -62% 0px", threshold: 0 },
    );

    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav
      aria-label="On this page"
      className={cn(
        "sticky top-16 z-30 border-b border-line-soft bg-paper/90 backdrop-blur-md lg:top-20",
        className,
      )}
    >
      <div className="container-x">
        <ul className="marquee-mask -mx-1 flex gap-2 overflow-x-auto px-1 py-3">
          {sections.map((section) => {
            const isActive = active === section.id;
            return (
              <li key={section.id} className="shrink-0">
                <a
                  href={`#${section.id}`}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "mono block rounded-full border px-3.5 py-1.5 text-eyebrow whitespace-nowrap transition-colors",
                    isActive
                      ? "border-ink bg-ink text-white"
                      : "border-line-mid bg-block-white text-ink-muted hover:border-ink hover:text-ink",
                  )}
                >
                  {section.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
