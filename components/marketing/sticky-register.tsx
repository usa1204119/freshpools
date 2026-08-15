"use client";

import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { formatPaise } from "@/lib/utils";

/**
 * Appears once the hero's own register button has scrolled out of view, so
 * there are never two identical CTAs on screen at the same time.
 */
export function StickyRegister({
  slug,
  registrationFee,
  isSponsoredFree,
  disabled,
  disabledLabel,
}: {
  slug: string;
  registrationFee: number;
  isSponsoredFree: boolean;
  disabled?: boolean;
  disabledLabel?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const anchor = document.getElementById("register-anchor");
    if (!anchor) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    observer.observe(anchor);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink bg-paper">
      <div className="container-x flex items-center justify-between gap-4 py-3">
        <p className="mono text-eyebrow text-ink-muted">
          {isSponsoredFree ? "Entry free" : `Entry ${formatPaise(registrationFee)}`}
        </p>
        {disabled ? (
          <p className="mono border border-ink bg-paper px-4 py-2 text-eyebrow">
            {disabledLabel ?? "Registration closed"}
          </p>
        ) : (
          <ButtonLink href={`/hackathons/${slug}/register`} size="sm">
            Register
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
