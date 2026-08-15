import { cn } from "@/lib/utils";

/**
 * Flat colour block + mono uppercase text. No radius, 1px ink border.
 *   yellow = pending · blue = active · coral = needs attention · black = done
 */
export type BadgeTone = "pending" | "active" | "attention" | "done" | "neutral";

const toneClass: Record<BadgeTone, string> = {
  pending: "bg-block-yellow text-ink",
  active: "bg-block-blue text-ink",
  attention: "bg-block-coral text-ink",
  done: "bg-block-ink text-white",
  neutral: "bg-block-white text-ink",
};

export function StatusBadge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "mono inline-flex items-center border border-ink px-2 py-1 text-eyebrow whitespace-nowrap",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ── Domain → tone maps, so the mapping lives in exactly one place ─────── */

export const paymentTone: Record<string, BadgeTone> = {
  PENDING: "pending",
  PAID: "done",
  WAIVED: "active",
  FAILED: "attention",
  REFUNDED: "active",
};

export const refundTone: Record<string, BadgeTone> = {
  NOT_DUE: "neutral",
  DUE: "pending",
  PROCESSED: "done",
  FAILED: "attention",
};

export const introTone: Record<string, BadgeTone> = {
  SENT: "pending",
  ACCEPTED: "active",
  INTERVIEWING: "active",
  OFFERED: "active",
  JOINED: "done",
  CLEARED: "done",
  PAID: "done",
  REJECTED: "attention",
  WITHDRAWN: "attention",
};

export const eventTone: Record<string, BadgeTone> = {
  DRAFT: "neutral",
  ANNOUNCED: "pending",
  REGISTRATION_OPEN: "active",
  REGISTRATION_CLOSED: "pending",
  LIVE: "active",
  JUDGING: "pending",
  COMPLETED: "done",
  CANCELLED: "attention",
};

export const requirementTone: Record<string, BadgeTone> = {
  NEW: "pending",
  QUALIFYING: "active",
  MATCHING: "active",
  SHORTLIST_SENT: "done",
  CLOSED: "done",
  LOST: "attention",
};

/** REGISTRATION_OPEN → "Registration open" */
export function humanizeEnum(value: string): string {
  const spaced = value.replace(/_/g, " ").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
