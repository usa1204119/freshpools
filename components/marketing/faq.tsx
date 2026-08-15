"use client";

import { useState, useId } from "react";
import { cn } from "@/lib/utils";
import { Eyebrow, MixedHeadline } from "./mixed-headline";

export interface FaqItem {
  q: string;
  a: string;
}

/**
 * Two-column split: left = headline + contact, right = accordion.
 * Rows separated by a 1px ink top border. Chevron rotates on open.
 * Native <button aria-expanded> so keyboard and screen readers work.
 */
export function Faq({
  items,
  eyebrow = "Questions",
  headline = "Everything you'd **actually** ask.",
  contactEmail = "hello@freshpools.in",
  contactLabel = "Still stuck? Write to us.",
}: {
  items: FaqItem[];
  eyebrow?: string;
  headline?: string;
  contactEmail?: string;
  contactLabel?: string;
}) {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  if (items.length === 0) return null;

  return (
    <section className="section-y bg-paper" aria-labelledby={`${baseId}-title`}>
      <div className="container-x grid gap-12 lg:grid-cols-[2fr_3fr] lg:gap-20">
        <div className="flex flex-col gap-6">
          <Eyebrow>{eyebrow}</Eyebrow>
          <MixedHeadline id={`${baseId}-title`} text={headline} as="h2" size="h2" />
          <div className="mt-2">
            <p className="text-body text-ink-muted">{contactLabel}</p>
            <a
              href={`mailto:${contactEmail}`}
              className="mono mt-2 inline-block text-label underline underline-offset-4"
            >
              {contactEmail}
            </a>
          </div>
        </div>

        <div className="border-b border-ink">
          {items.map((item, index) => {
            const isOpen = open === index;
            const panelId = `${baseId}-panel-${index}`;
            const buttonId = `${baseId}-button-${index}`;

            return (
              <div key={item.q} className="border-t border-ink">
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-6 py-6 text-left"
                  >
                    <span className="font-sans text-[17px] leading-snug font-medium">
                      {item.q}
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "shrink-0 text-lg transition-transform duration-200",
                        isOpen && "rotate-180",
                      )}
                    >
                      ⌄
                    </span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!isOpen}
                  className="pb-6"
                >
                  <p className="hl-serif max-w-prose text-[16px] italic text-ink-muted">
                    {item.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
