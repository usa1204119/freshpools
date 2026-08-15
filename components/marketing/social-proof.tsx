import { cn, initials } from "@/lib/utils";

/**
 * Avatar stack + rating + count.
 *
 * NON-NEGOTIABLE #12 applies with full force here: this is exactly the kind of
 * component that tempts a placeholder. It renders NOTHING when the count is
 * zero, and the names must be real people from the database — never invented
 * to fill the row.
 */
export function SocialProof({
  names,
  total,
  caption,
  className,
}: {
  /** Real names, used only for initials. Pass an empty array if none. */
  names: string[];
  /** Real verified count. Zero renders nothing. */
  total: number;
  caption?: string;
  className?: string;
}) {
  if (total <= 0 || names.length === 0) return null;

  const shown = names.slice(0, 4);
  const remainder = total - shown.length;

  // Cycles the accent blocks so the stack reads as part of the system.
  const fills = ["bg-block-blue", "bg-block-coral", "bg-block-yellow", "bg-block-white"];

  return (
    <div className={cn("flex flex-wrap items-center gap-4", className)}>
      <ul className="flex items-center -space-x-2.5">
        {shown.map((name, index) => (
          <li
            key={`${name}-${index}`}
            className={cn(
              "mono flex size-9 items-center justify-center rounded-full border border-ink/15 text-[10px] text-ink",
              fills[index % fills.length],
            )}
          >
            {initials(name)}
          </li>
        ))}
        {remainder > 0 ? (
          <li className="mono flex size-9 items-center justify-center rounded-full border border-ink bg-ink text-[10px] text-white">
            +{remainder}
          </li>
        ) : null}
      </ul>

      <div>
        <p aria-hidden="true" className="text-[13px] leading-none tracking-[0.15em]">
          ★★★★★
        </p>
        <p className="mono mt-1.5 text-eyebrow text-ink-muted">
          {caption ?? `${total} verified this season`}
        </p>
      </div>
    </div>
  );
}
