"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";

/**
 * Audience-first, five items. People arrive knowing which of the three they
 * are, so the nav is organised by who you are rather than by feature. The ink
 * CTA stays far right and stays the loudest thing in the bar — the landing
 * page's single job is getting a company to the requirement form.
 */
const LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/for-companies", label: "For companies" },
  { href: "/for-colleges", label: "For colleges" },
  { href: "/hackathons", label: "Events" },
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
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // The bar only gains its edge once content passes under it.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The mobile panel covers the page, so the page behind it must not scroll.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on route change and on Escape.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-paper/85 backdrop-blur-md transition-shadow duration-200",
        scrolled ? "border-b border-line-soft shadow-sm" : "border-b border-transparent",
      )}
    >
      <nav
        aria-label="Primary"
        className="container-x flex h-16 items-center justify-between gap-6 lg:h-20"
      >
        <Logo />

        <ul className="hidden items-center gap-7 lg:flex">
          {LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative py-1 text-[15px] transition-colors",
                    active
                      ? "font-medium text-ink"
                      : "text-ink-muted hover:text-ink",
                  )}
                >
                  {link.label}
                  {/* Active state is a 2px ink underline, not just a hover. */}
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-0.5 left-0 h-0.5 w-full bg-ink"
                    />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden items-center gap-5 lg:flex">
          <Link
            href={dashboardHref ?? "/login"}
            className="text-[15px] text-ink-muted transition-colors hover:text-ink"
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
          className="mono rounded-md border border-line-mid px-3 py-2 text-eyebrow lg:hidden"
        >
          {open ? "Close" : "Menu"}
        </button>
      </nav>

      {/* Full-screen overlay rather than an inline dropdown — five items plus
          two actions is too much to push the page down by. */}
      {open ? (
        <div
          id="mobile-nav"
          className="fixed inset-0 top-16 z-50 flex flex-col bg-paper lg:hidden"
        >
          <ul className="container-x flex flex-1 flex-col gap-1 overflow-y-auto pt-6">
            {LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-md px-4 py-4 text-[22px] transition-colors",
                      active ? "bg-block-blue font-medium" : "hover:bg-sky-50",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="container-x flex flex-col gap-4 border-t border-line-soft py-6">
            <Link
              href={dashboardHref ?? "/login"}
              onClick={() => setOpen(false)}
              className="mono text-label underline underline-offset-4"
            >
              {dashboardHref ? "Dashboard" : "Sign in"}
            </Link>
            <ButtonLink
              href="/for-companies"
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
