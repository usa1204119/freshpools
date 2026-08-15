import * as React from "react";
import { cn } from "@/lib/utils";


/**
 * NON-NEGOTIABLE #9: every major headline mixes Instrument Serif with heavy
 * Satoshi. Write the copy as one string and wrap the emphasis in **asterisks**:
 *
 *   <MixedHeadline as="h1" size="h1"
 *     text="Hire freshers who have **already built** something." />
 *
 * Renders as: serif · sans-bold · serif.
 */

type Segment = { text: string; emphasis: boolean };

function parse(text: string): Segment[] {
  // Split on **...** while keeping the delimiters in the result array.
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter((chunk) => chunk.length > 0)
    .map((chunk) => {
      const emphasis = chunk.startsWith("**") && chunk.endsWith("**");
      return { text: emphasis ? chunk.slice(2, -2) : chunk, emphasis };
    });
}

const sizeClass = {
  h1: "type-h1",
  h2: "type-h2",
  h3: "type-h3",
} as const;

export interface MixedHeadlineProps {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "div";
  size?: keyof typeof sizeClass;
  className?: string;
  /**
   * Hero only: stagger each segment 60ms on load. Sections use <Reveal>
   * instead, which fires on scroll.
   */
  stagger?: boolean;
  id?: string;
}

export function MixedHeadline({
  text,
  as: Tag = "h2",
  size = "h2",
  className,
  stagger = false,
  id,
}: MixedHeadlineProps) {
  const segments = parse(text);

  return (
    <Tag id={id} className={cn(sizeClass[size], "text-ink", className)}>
      {segments.map((segment, index) => {
        const content = (
          <span
            className={cn(
              segment.emphasis ? "hl-sans" : "hl-serif",
              // The emphasis is the whole point of a mixed headline — letting
              // it break mid-phrase ("already / built") destroys the effect.
              //
              // The 14-character ceiling is not arbitrary: at the 88px h1 in a
              // ~700px column, roughly 16 characters fit on a line, so a longer
              // held phrase would overflow its column instead of wrapping.
              // Anything longer is allowed to break normally.
              segment.emphasis && segment.text.trim().length <= 14
                ? "whitespace-nowrap"
                : undefined,
            )}
          >
            {segment.text}
          </span>
        );

        if (!stagger) {
          return <React.Fragment key={index}>{content}</React.Fragment>;
        }

        return (
          <span
            key={index}
            data-rise=""
            className="rise inline"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            {content}
          </span>
        );
      })}
    </Tag>
  );
}

/** ✦ HOW VERIFICATION WORKS */
export function Eyebrow({
  children,
  className,
  as: Tag = "p",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "p" | "span" | "div" | "h2";
}) {
  return (
    <Tag className={cn("mono flex items-center gap-2 text-eyebrow text-ink", className)}>
      <span aria-hidden="true" className="text-[13px] leading-none">
        ✦
      </span>
      <span>{children}</span>
    </Tag>
  );
}

/**
 * Section header pattern: left column 40% (eyebrow + headline + one-liner),
 * right column 60% (the actual content).
 */
export function SectionHeader({
  eyebrow,
  headline,
  sub,
  children,
  className,
  headingId,
}: {
  eyebrow: string;
  headline: string;
  sub?: string;
  children?: React.ReactNode;
  className?: string;
  headingId?: string;
}) {
  return (
    <div className={cn("grid gap-10 lg:grid-cols-[2fr_3fr] lg:gap-16", className)}>
      <div className="flex flex-col gap-6">
        <Eyebrow>{eyebrow}</Eyebrow>
        <MixedHeadline id={headingId} text={headline} as="h2" size="h2" />
        {sub ? <p className="max-w-md text-body-lg text-ink-muted">{sub}</p> : null}
      </div>
      {children ? <div>{children}</div> : null}
    </div>
  );
}
