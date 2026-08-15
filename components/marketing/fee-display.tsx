import { cn, formatPaise } from "@/lib/utils";

export interface FeeDisplayProps {
  registrationFee: number; // paise
  depositAmount: number; // paise
  isSponsoredFree: boolean;
  sponsorName?: string | null;
  /** `inline` for list cards, `banner` for the event page strip. */
  variant?: "inline" | "banner";
  className?: string;
}

/**
 * Two states, per spec:
 *   Normal     ENTRY ₹200 · ₹100 REFUNDABLE
 *   Sponsored  ENTRY ₹̶2̶0̶0̶ FREE · SPONSORED BY [COMPANY]   (yellow strip)
 *
 * The amount is Satoshi 700; everything around it is mono uppercase.
 */
export function FeeDisplay({
  registrationFee,
  depositAmount,
  isSponsoredFree,
  sponsorName,
  variant = "inline",
  className,
}: FeeDisplayProps) {
  const isBanner = variant === "banner";

  if (isSponsoredFree) {
    return (
      <p
        className={cn(
          "mono flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-md border border-ink bg-block-yellow text-ink",
          isBanner ? "px-6 py-4 text-label" : "px-3 py-2 text-eyebrow",
          className,
        )}
      >
        <span>Entry</span>
        {registrationFee > 0 ? (
          <span className="struck text-ink-muted" aria-label="was">
            {formatPaise(registrationFee)}
          </span>
        ) : null}
        <span className={cn("font-sans font-bold", isBanner ? "text-2xl" : "text-lg")}>
          Free
        </span>
        {sponsorName ? (
          <span className="text-ink-muted">· Sponsored by {sponsorName}</span>
        ) : null}
      </p>
    );
  }

  return (
    <p
      className={cn(
        "mono flex flex-wrap items-baseline gap-x-3 gap-y-1 text-ink",
        isBanner ? "border border-line-soft bg-block-white px-6 py-4 text-label" : "text-eyebrow",
        className,
      )}
    >
      <span>Entry</span>
      <span className={cn("font-sans font-bold", isBanner ? "text-2xl" : "text-lg")}>
        {formatPaise(registrationFee)}
      </span>
      {depositAmount > 0 ? (
        <span className="text-ink-muted">
          · {formatPaise(depositAmount)} refundable
        </span>
      ) : null}
    </p>
  );
}

/**
 * NON-NEGOTIABLE #5. This line appears on every page that mentions money to a
 * student. It is the trust element — do not shorten it, do not bury it.
 */
export function StudentsNeverPayNote({
  className,
  variant = "block",
}: {
  className?: string;
  variant?: "block" | "line";
}) {
  if (variant === "line") {
    return (
      <p className={cn("text-[15px] text-ink-muted", className)}>
        FreshPools never charges students for placement or shortlisting.
        Companies pay us.
      </p>
    );
  }

  return (
    <div className={cn("border border-ink bg-block-blue p-6 sm:p-8", className)}>
      <p className="mono mb-3 text-eyebrow">✦ How we make money</p>
      <p className="text-body-lg text-ink">
        <span className="hl-sans">
          FreshPools never takes money from students for placement or
          shortlisting.
        </span>{" "}
        <span className="hl-serif">
          The registration fee covers event logistics only — food, venue,
          internet, prizes. Companies pay us when they hire. There is no paid
          tier, no priority for payment, and no subscription for candidates.
        </span>
      </p>
    </div>
  );
}
