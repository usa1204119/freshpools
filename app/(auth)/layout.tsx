import Link from "next/link";
import { Logo } from "@/components/marketing/nav";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-sky">
      <header className="border-b border-ink bg-paper">
        <div className="container-x flex h-16 items-center justify-between lg:h-20">
          <Logo />
          <Link
            href="/"
            className="mono text-eyebrow underline underline-offset-4"
          >
            ← Back to site
          </Link>
        </div>
      </header>

      <main id="main" className="container-x flex flex-1 items-center py-12 lg:py-20">
        {children}
      </main>

      <footer className="border-t border-ink bg-paper">
        <div className="container-x py-5">
          <p className="mono text-eyebrow text-ink-muted">
            Students never pay for placement · hello@freshpools.in
          </p>
        </div>
      </footer>
    </div>
  );
}
