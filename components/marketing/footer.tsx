import Link from "next/link";
import { Logo } from "./nav";

const COLUMNS = [
  {
    label: "Platform",
    links: [
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
    ],
  },
  {
    label: "For companies",
    links: [
      { href: "/for-companies", label: "Post a requirement" },
      { href: "/for-companies#pricing", label: "How pricing works" },
      { href: "/for-companies#verification", label: "How verification works" },
      { href: "/login", label: "Company sign in" },
    ],
  },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ink bg-paper">
      <div className="container-x grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:py-20">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="hl-serif max-w-[26ch] text-[17px] text-ink-muted">
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
                    className="text-[15px] text-ink underline-offset-4 hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-ink">
        <div className="container-x flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="mono text-eyebrow text-ink-muted">
            © {year} FreshPools · Made in India
          </p>
          <p className="mono text-eyebrow text-ink-muted">
            Students never pay for placement
          </p>
        </div>
      </div>
    </footer>
  );
}
