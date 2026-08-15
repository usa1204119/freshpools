import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The colour cycle used across every card grid: blue → white → coral → yellow.
 * NON-NEGOTIABLE #16: coral and yellow always carry INK text, never white.
 */
export const BLOCK_CYCLE = ["blue", "white", "coral", "yellow"] as const;
export type BlockColor = (typeof BLOCK_CYCLE)[number] | "ink" | "sky" | "paper";

export const blockBg: Record<BlockColor, string> = {
  blue: "bg-block-blue text-ink",
  white: "bg-block-white text-ink",
  coral: "bg-block-coral text-ink",
  yellow: "bg-block-yellow text-ink",
  ink: "bg-block-ink text-white",
  sky: "bg-sky text-ink",
  paper: "bg-paper text-ink",
};

export function blockAt(index: number): BlockColor {
  return BLOCK_CYCLE[index % BLOCK_CYCLE.length];
}

/** A flat colour panel: 1px ink border, zero radius, no shadow. */
export function Block({
  color = "white",
  className,
  children,
  as: Tag = "div",
}: {
  color?: BlockColor;
  className?: string;
  children: React.ReactNode;
  as?: "div" | "article" | "section" | "li" | "aside";
}) {
  return (
    <Tag className={cn("border border-ink", blockBg[color], className)}>
      {children}
    </Tag>
  );
}

/**
 * Feature card. The mono index number renders ONLY when `index` is passed —
 * NON-NEGOTIABLE #10: numbered markers exist only where content is a real
 * sequence.
 */
export function FeatureCard({
  color = "white",
  icon,
  index,
  heading,
  body,
  link,
  className,
}: {
  color?: BlockColor;
  icon?: React.ReactNode;
  index?: number;
  heading: string;
  body: string;
  link?: { href: string; label: string };
  className?: string;
}) {
  const isInkBlock = color === "ink";

  return (
    <Block
      as="article"
      color={color}
      className={cn("flex flex-col gap-6 p-8", className)}
    >
      <div className="flex items-start justify-between gap-4">
        {icon ? (
          <span
            aria-hidden="true"
            className={cn(
              "flex size-12 shrink-0 items-center justify-center border",
              isInkBlock ? "border-white" : "border-ink",
            )}
          >
            {icon}
          </span>
        ) : (
          <span />
        )}
        {typeof index === "number" ? (
          <span
            aria-hidden="true"
            className={cn(
              "mono text-label",
              isInkBlock ? "text-white/70" : "text-ink-muted",
            )}
          >
            {String(index).padStart(2, "0")}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <h3
          className={cn(
            "font-sans text-[26px] leading-[1.1] font-bold tracking-[-0.02em] sm:text-[30px]",
          )}
        >
          {heading}
        </h3>
        <p
          className={cn(
            "text-[15px] leading-relaxed",
            isInkBlock ? "text-white/80" : "text-ink-muted",
          )}
        >
          {body}
        </p>
      </div>

      {link ? (
        <Link
          href={link.href}
          className={cn(
            "mono group/link mt-auto inline-flex items-center gap-2 text-label underline underline-offset-4",
            isInkBlock ? "text-white" : "text-ink",
          )}
        >
          {link.label}
          <span
            aria-hidden="true"
            className="transition-transform duration-200 group-hover/link:translate-x-1"
          >
            →
          </span>
        </Link>
      ) : null}
    </Block>
  );
}

/**
 * Card grid for lists whose length is not known ahead of time.
 *
 * The flush grids elsewhere paint their 1px separators using the container's
 * ink background showing through `gap-px`. That is fine for a fixed-length list
 * (four verification steps, six timeline stages) but breaks badly for a dynamic
 * one: any cell the items don't fill renders as a solid BLACK RECTANGLE. One
 * live event in a two-column grid produced exactly that.
 *
 * So dynamic lists get real gaps and self-bordered cards. Still 1px solid ink,
 * still zero radius — just immune to a part-filled final row.
 */
export function CardGrid({
  children,
  columns = "sm:grid-cols-2 lg:grid-cols-3",
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  /** Responsive column classes. Any count is safe. */
  columns?: string;
  className?: string;
  as?: "div" | "ul";
}) {
  return (
    <Tag className={cn("grid gap-4", columns, className)}>{children}</Tag>
  );
}

/** Big number + label, used in the problem section. */
export function StatBlock({
  color = "white",
  value,
  label,
  source,
}: {
  color?: BlockColor;
  value: string;
  label: string;
  source?: string;
}) {
  return (
    <Block color={color} className="flex flex-col gap-3 p-8">
      <p className="font-sans text-[44px] leading-none font-bold tracking-[-0.03em] sm:text-[56px]">
        {value}
      </p>
      <p className="text-[15px] leading-snug text-ink-muted">{label}</p>
      {source ? (
        <p className="mono mt-auto pt-4 text-eyebrow text-ink-muted">{source}</p>
      ) : null}
    </Block>
  );
}
