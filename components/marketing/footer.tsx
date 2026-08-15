import Link from "next/link";
import { Logo } from "./nav";

const COLUMNS = [
  {
    label: "Platform",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/hackathons", label: "Events" },
      { href: "/for-companies", label: "For companies" },
      { href: "/for-colleges", label: "For colleges" },
      { href: "/about", label: "About" },
    ],
  },
  {
    label: "For students",
    links: [
      { href: "/hackathons", label: "Upcoming events" },
      { href: "/signup", label: "Create a profile" },
      { href: "/me", label: "My dashboard" },
      { href: "/about#fees", label: "Fees & refunds" },
      { href: "/how-it-works", label: "How you're scored" },
    ],
  },
  {
    label: "For companies",
    links: [
      { href: "/for-companies", label: "Post a requirement" },
      { href: "/for-companies#pricing", label: "How pricing works" },
      { href: "/how-it-works", label: "How verification works" },
      { href: "/login", label: "Company sign in" },
    ],
  },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line-soft bg-paper">
      <div className="container-x grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:py-20">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="hl-serif max-w-[26ch] text-[18px] text-ink-muted">
            Verified fresher talent, proven through competitive nature.
          </p>
          <a
            href="mailto:hello@freshpools.in"
            className="mono mt-2 text-label underline underline-offset-4"
          >
            hello@freshpools.in
          </a>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.label} className="flex flex-col gap-4">
            <p className="mono text-eyebrow text-ink-muted">{column.label}</p>
            <ul className="flex flex-col gap-3">
              {column.links.map((link) => (
                <li key={`${column.label}-${link.href}-${link.label}`}>
                  <Link
                    href={link.href}
                    className="text-[15px] text-ink-muted transition-colors hover:text-ink hover:underline hover:underline-offset-4"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line-soft">
        <div className="container-x flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="mono text-eyebrow text-ink-muted">
            © {year} FreshPools · Made in India
          </p>
          <div className="mono flex flex-wrap items-center gap-5 text-eyebrow text-ink-muted">
            <Link href="/privacy" className="transition-colors hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-ink">
              Terms
            </Link>
            {/* The trust element, kept where it is seen on every page. */}
            <span className="text-ink">Students never pay for placement</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
