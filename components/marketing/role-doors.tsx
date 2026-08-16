"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eyebrow } from "./mixed-headline";
import { cn } from "@/lib/utils";

/**
 * Three doors, one per audience.
 *
 * Deliberately NOT a role gate. A full-screen chooser would make a company
 * arriving from search self-identify before reading a word of the pitch, and
 * the landing page's single job is getting a company to the requirement form.
 * It also fires only once, while the confusion it addresses recurs.
 *
 * Instead: an always-visible signpost that remembers. Picking a door stores
 * the choice, and a returning visitor gets a "continue" bar in the nav — the
 * routing benefit of a gate, without blocking anyone or costing the homepage
 * its crawlable content.
 */

export const ROLE_KEY = "fp:role";

export type VisitorRole = "company" | "student" | "college";

export const DOORS: {
  role: VisitorRole;
  label: string;
  href: string;
  blurb: string;
  cta: string;
  tone: "yellow" | "blue" | "coral";
}[] = [
  {
    role: "company",
    label: "I'm hiring",
    href: "/for-companies",
    blurb:
      "Describe the role once. We come back with freshers whose code we have read and whose demo we have watched.",
    cta: "Post a requirement",
    tone: "yellow",
  },
  {
    role: "student",
    label: "I'm a student",
    href: "/hackathons",
    blurb:
      "Compete on a real problem, get your code reviewed by a human, and keep a verified profile whether you win or not.",
    cta: "Find an event",
    tone: "blue",
  },
  {
    role: "college",
    label: "I'm a college",
    href: "/for-colleges",
    blurb:
      "Host a sponsor-funded hackathon at zero cost to you, or book a two-day bootcamp before it.",
    cta: "See both offerings",
    tone: "coral",
  },
];

export function rememberRole(role: VisitorRole) {
  try {
    window.localStorage.setItem(ROLE_KEY, role);
  } catch {
    // Private browsing or storage disabled — the doors still work, they just
    // will not be remembered. Never let this break navigation.
  }
}

const toneClass = {
  yellow: "bg-block-yellow",
  blue: "bg-block-blue",
  coral: "bg-block-coral",
} as const;

export function RoleDoors() {
  // Tight top padding on purpose — these cards have to break the fold, or a
  // student still lands on a company pitch with no hint that more exists.
  return (
    <section className="bg-paper pt-10 pb-16 lg:pt-12 lg:pb-24" aria-labelledby="doors-title">
      <div className="container-x">
        <div className="mb-7 flex flex-col gap-3">
          <Eyebrow>Start here</Eyebrow>
          <h2
            id="doors-title"
            className="type-h3 max-w-[24ch] text-ink"
          >
            <span className="hl-serif">Three ways in.</span>{" "}
            <span className="hl-sans">Pick yours.</span>
          </h2>
        </div>

        <ul className="grid gap-5 lg:grid-cols-3">
          {DOORS.map((door) => (
            <li key={door.role}>
              <Link
                href={door.href}
                onClick={() => rememberRole(door.role)}
                className={cn(
                  "group/door flex h-full flex-col gap-4 rounded-lg border border-line-soft p-8 transition-shadow hover:shadow-md",
                  toneClass[door.tone],
                )}
              >
                <span className="font-sans text-[26px] leading-tight font-bold tracking-[-0.02em]">
                  {door.label}
                </span>
                <span className="text-[15px] leading-relaxed text-ink-muted">
                  {door.blurb}
                </span>
                <span className="mono mt-auto inline-flex items-center gap-2 pt-2 text-label">
                  {door.cta}
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-200 group-hover/door:translate-x-1"
                  >
                    →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Slim bar shown to a returning visitor who has already picked a lane.
 * Renders after mount only — reading localStorage during render would
 * mismatch the server HTML.
 */
export function ResumeBar() {
  const [role, setRole] = useState<VisitorRole | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(ROLE_KEY);
      if (stored === "company" || stored === "student" || stored === "college") {
        setRole(stored);
      }
    } catch {
      /* storage unavailable — no bar, no harm */
    }
  }, []);

  if (!role) return null;
  const door = DOORS.find((d) => d.role === role);
  if (!door) return null;

  return (
    <div className="border-b border-line-soft bg-sky-50">
      <div className="container-x flex flex-wrap items-center justify-between gap-3 py-2.5">
        <p className="mono text-eyebrow text-ink-muted">
          Welcome back · {door.label}
        </p>
        <div className="flex items-center gap-4">
          <Link
            href={door.href}
            className="mono text-eyebrow underline underline-offset-4"
          >
            {door.cta} →
          </Link>
          <button
            type="button"
            onClick={() => {
              try {
                window.localStorage.removeItem(ROLE_KEY);
              } catch {
                /* ignore */
              }
              setRole(null);
            }}
            className="mono text-eyebrow text-ink-muted hover:text-ink"
            aria-label="Dismiss and forget my choice"
          >
            Not you?
          </button>
        </div>
      </div>
    </div>
  );
}
