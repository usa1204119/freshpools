import Link from "next/link";
import { Logo } from "@/components/marketing/nav";
import { signOutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string };

/**
 * App chrome. Marketing pages are editorial; app pages are tight and
 * functional — serif appears in the page title only, everything else is
 * Satoshi with mono data labels.
 */
export function AppShell({
  nav,
  children,
  areaLabel,
  userName,
  layout = "topbar",
}: {
  nav: NavItem[];
  children: React.ReactNode;
  areaLabel: string;
  userName?: string | null;
  /**
   * `sidebar` at lg+ for areas with many destinations. Nine admin items in a
   * horizontally scrolling strip was the main reason admin felt hard to
   * navigate; four to six items are fine as a topbar.
   */
  layout?: "topbar" | "sidebar";
}) {
  if (layout === "sidebar") {
    return (
      <AppSidebarShell nav={nav} areaLabel={areaLabel} userName={userName}>
        {children}
      </AppSidebarShell>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="sticky top-0 z-40 border-b border-line-soft bg-paper/90 backdrop-blur">
        <div className="container-x flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="mono hidden rounded-sm border border-line-mid px-2 py-1 text-eyebrow sm:inline-block">
              {areaLabel}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {userName ? (
              <span className="mono hidden text-eyebrow text-ink-muted sm:inline">
                {userName}
              </span>
            ) : null}
            <form action={signOutAction}>
              <button
                type="submit"
                className="mono rounded-md border border-line-mid px-3 py-2 text-eyebrow transition-colors hover:border-ink hover:bg-ink hover:text-white"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        <nav aria-label={areaLabel} className="border-t border-line-soft bg-block-white">
          <ul className="container-x flex gap-0 overflow-x-auto">
            {nav.map((item) => (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  className="mono block px-4 py-3 text-eyebrow whitespace-nowrap transition-colors hover:bg-block-yellow"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="main" className="container-x flex-1 py-10 lg:py-14">
        {children}
      </main>

      <footer className="border-t border-line-soft bg-block-white">
        <div className="container-x py-5">
          <p className="mono text-eyebrow text-ink-muted">
            FreshPools · Students never pay for placement
          </p>
        </div>
      </footer>
    </div>
  );
}

/**
 * Sidebar variant for the admin area. Collapses to the same top strip below
 * `lg`, where a fixed sidebar would eat most of the screen.
 */
function AppSidebarShell({
  nav,
  children,
  areaLabel,
  userName,
}: {
  nav: NavItem[];
  children: React.ReactNode;
  areaLabel: string;
  userName?: string | null;
}) {
  return (
    <div className="min-h-screen bg-paper lg:flex">
      <aside className="hidden w-60 shrink-0 border-r border-line-soft bg-block-white lg:flex lg:flex-col">
        <div className="flex items-center gap-3 px-5 py-6">
          <Logo />
          <span className="mono rounded-sm border border-line-mid px-2 py-1 text-eyebrow">
            {areaLabel}
          </span>
        </div>

        <nav aria-label={areaLabel} className="flex-1 px-3">
          <ul className="flex flex-col gap-0.5">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="mono block rounded-md px-3 py-2.5 text-eyebrow transition-colors hover:bg-sky-50"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-line-soft px-5 py-4">
          {userName ? (
            <p className="mono mb-3 text-eyebrow text-ink-muted">{userName}</p>
          ) : null}
          <form action={signOutAction}>
            <button
              type="submit"
              className="mono w-full rounded-md border border-line-mid px-3 py-2 text-eyebrow transition-colors hover:border-ink hover:bg-ink hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Below lg the sidebar becomes the familiar scrolling strip. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-line-soft bg-paper/90 backdrop-blur lg:hidden">
          <div className="container-x flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Logo />
              <span className="mono rounded-sm border border-line-mid px-2 py-1 text-eyebrow">
                {areaLabel}
              </span>
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                className="mono rounded-md border border-line-mid px-3 py-2 text-eyebrow"
              >
                Sign out
              </button>
            </form>
          </div>
          <nav aria-label={areaLabel} className="border-t border-line-soft bg-block-white">
            <ul className="container-x flex gap-0 overflow-x-auto">
              {nav.map((item) => (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    className="mono block px-4 py-3 text-eyebrow whitespace-nowrap hover:bg-block-yellow"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <main id="main" className="flex-1 px-6 py-10 lg:px-10 lg:py-12">
          {children}
        </main>

        <footer className="border-t border-line-soft bg-block-white">
          <div className="px-6 py-5 lg:px-10">
            <p className="mono text-eyebrow text-ink-muted">
              FreshPools · Students never pay for placement
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

/** Serif page title — the only serif on an app page. */
export function PageTitle({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-col gap-4 border-b border-line-soft pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="hl-serif text-[34px] leading-none tracking-[-0.02em] lg:text-[44px]">
          {title}
        </h1>
        {sub ? <p className="mt-3 max-w-2xl text-[15px] text-ink-muted">{sub}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Data tile: mono label, big value. Used across all three dashboards. */
export function StatTile({
  label,
  value,
  note,
  tone = "white",
}: {
  label: string;
  value: string | number;
  note?: string;
  tone?: "white" | "yellow" | "blue" | "coral" | "ink";
}) {
  const bg = {
    white: "bg-block-white text-ink",
    yellow: "bg-block-yellow text-ink",
    blue: "bg-block-blue text-ink",
    coral: "bg-block-coral text-ink",
    ink: "bg-block-ink text-white",
  }[tone];

  return (
    <div className={cn("p-5", bg)}>
      <p
        className={cn(
          "mono text-eyebrow",
          tone === "ink" ? "text-white/70" : "text-ink-muted",
        )}
      >
        {label}
      </p>
      <p className="mt-3 font-sans text-[32px] leading-none font-bold tabular-nums">
        {value}
      </p>
      {note ? (
        <p
          className={cn(
            "mt-2 text-[13px]",
            tone === "ink" ? "text-white/70" : "text-ink-muted",
          )}
        >
          {note}
        </p>
      ) : null}
    </div>
  );
}

export function StatRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-lg border border-line-soft bg-line-soft sm:grid-cols-2 lg:grid-cols-4">
      {children}
    </div>
  );
}

/** Table shell. v3: soft hairlines between rows, ink only under the header.
    No zebra stripes — that rule survives from v2. */
export function DataTable({
  headers,
  children,
  caption,
  minWidth = 720,
}: {
  headers: string[];
  children: React.ReactNode;
  caption: string;
  minWidth?: number;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line-soft">
      <table
        className="w-full border-collapse bg-block-white text-left"
        style={{ minWidth }}
      >
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line-mid">
            {headers.map((heading) => (
              <th
                key={heading}
                scope="col"
                className="mono px-4 py-3 text-eyebrow whitespace-nowrap text-ink-muted"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Td({
  children,
  className,
  colSpan,
}: {
  children?: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn("px-4 py-4 align-top", className)}
    >
      {children}
    </td>
  );
}

export function Tr({ children }: { children: React.ReactNode }) {
  return <tr className="border-b border-line-soft last:border-b-0">{children}</tr>;
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line-soft bg-block-white p-10">
      <p className="hl-serif text-[24px] leading-tight">{title}</p>
      <p className="mt-3 max-w-xl text-[15px] text-ink-muted">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function SetupNotice() {
  return (
    <div className="rounded-lg border border-ink bg-block-yellow p-8">
      <p className="mono mb-3 text-eyebrow">✦ Not connected</p>
      <p className="text-body-lg">
        This area needs a database. Set <code>DATABASE_URL</code> in{" "}
        <code>.env.local</code>, then run <code>npm run db:push</code> and{" "}
        <code>npm run db:seed</code>.
      </p>
    </div>
  );
}
