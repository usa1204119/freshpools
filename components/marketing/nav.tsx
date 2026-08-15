"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";

const LINKS = [
  { href: "/hackathons", label: "Events" },
  { href: "/for-companies", label: "For companies" },
  { href: "/for-colleges", label: "For colleges" },
  { href: "/about", label: "About" },
] as const;

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("font-sans text-[20px] font-bold tracking-[-0.03em]", className)}
    >
      Fresh<span className="hl-serif font-normal italic">Pools</span>
    </Link>
  );
}

export function Nav({
  dashboardHref,
}: {
  /** Set when a session exists — swaps the sign-in link for a dashboard link. */
  dashboardHref?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-ink bg-paper">
      <nav
        aria-label="Primary"
        className="container-x flex h-16 items-center justify-between gap-6 lg:h-20"
      >
        <Logo />

        <ul className="hidden items-center gap-8 lg:flex">
          {LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "text-[15px] text-ink decoration-1 underline-offset-4 hover:underline",
                    active && "underline",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden items-center gap-4 lg:flex">
          <Link
            href={dashboardHref ?? "/login"}
            className="text-[15px] text-ink underline-offset-4 hover:underline"
          >
            {dashboardHref ? "Dashboard" : "Sign in"}
          </Link>
          <ButtonLink href="/for-companies" size="sm">
            Post a requirement
          </ButtonLink>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="mono border border-ink px-3 py-2 text-eyebrow lg:hidden"
        >
          {open ? "Close" : "Menu"}
        </button>
      </nav>

      {open ? (
        <div id="mobile-nav" className="border-t border-ink bg-paper lg:hidden">
          <ul className="container-x flex flex-col py-2">
            {LINKS.map((link) => (
              <li key={link.href} className="border-b border-ink last:border-b-0">
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block py-4 text-[17px]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="container-x flex flex-col gap-3 border-t border-ink py-5">
            <Link
              href={dashboardHref ?? "/login"}
              onClick={() => setOpen(false)}
              className="mono text-label underline underline-offset-4"
            >
              {dashboardHref ? "Dashboard" : "Sign in"}
            </Link>
            <ButtonLink
              href="/for-companies"
              size="sm"
              className="w-full"
              onClick={() => setOpen(false)}
            >
              Post a requirement
            </ButtonLink>
          </div>
        </div>
      ) : null}
    </header>
  );
}
