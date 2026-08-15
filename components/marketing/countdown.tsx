"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Remaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
};

function diff(target: number): Remaining {
  const ms = target - Date.now();
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms / 3_600_000) % 24),
    minutes: Math.floor((ms / 60_000) % 60),
    seconds: Math.floor((ms / 1000) % 60),
    done: false,
  };
}

/**
 * Rendered client-side only after mount — a server-rendered countdown would
 * hydrate against a stale timestamp and flicker.
 */
export function Countdown({
  deadline,
  label = "Registration closes in",
  className,
  closedLabel = "Registration closed",
}: {
  deadline: string | Date;
  label?: string;
  className?: string;
  closedLabel?: string;
}) {
  const target = new Date(deadline).getTime();
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    setRemaining(diff(target));
    const id = setInterval(() => setRemaining(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!remaining) {
    // Reserve the row so layout doesn't jump on hydration.
    return <div className={cn("h-[76px]", className)} aria-hidden="true" />;
  }

  if (remaining.done) {
    return (
      <p className={cn("mono rounded-md border border-line-mid bg-paper px-4 py-3 text-label", className)}>
        {closedLabel}
      </p>
    );
  }

  const units = [
    { value: remaining.days, label: "Days" },
    { value: remaining.hours, label: "Hrs" },
    { value: remaining.minutes, label: "Min" },
    { value: remaining.seconds, label: "Sec" },
  ];

  return (
    <div className={className}>
      <p className="mono mb-2 text-eyebrow text-ink-muted">{label}</p>
      <ul className="flex w-max overflow-hidden rounded-md border border-line-mid">
        {units.map((unit) => (
          <li
            key={unit.label}
            className="min-w-16 border-r border-line-soft px-3 py-2 text-center last:border-r-0"
          >
            <span className="block font-sans text-[24px] leading-none font-bold tabular-nums">
              {String(unit.value).padStart(2, "0")}
            </span>
            <span className="mono mt-1 block text-eyebrow text-ink-muted">
              {unit.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
