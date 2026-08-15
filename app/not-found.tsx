import Link from "next/link";
import { Eyebrow, MixedHeadline } from "@/components/marketing/mixed-headline";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/marketing/nav";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-screen flex-col bg-sky">
      <div className="container-x border-b border-ink py-6">
        <Logo />
      </div>
      <div className="container-x flex flex-1 flex-col justify-center py-20">
        <Eyebrow className="mb-6">404</Eyebrow>
        <MixedHeadline
          text="That page **doesn't exist.**"
          as="h1"
          size="h1"
          className="max-w-[12ch]"
        />
        <p className="mt-8 max-w-xl text-body-lg text-ink-muted">
          The link may be old, or the event may have been taken down. Everything
          live is one of these:
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <ButtonLink href="/">Back to home</ButtonLink>
          <ButtonLink href="/hackathons" variant="secondary">
            See events
          </ButtonLink>
        </div>
        <p className="mt-10 text-[15px] text-ink-muted">
          Think this is a mistake?{" "}
          <Link href="mailto:hello@freshpools.in" className="underline underline-offset-4">
            hello@freshpools.in
          </Link>
        </p>
      </div>
    </main>
  );
}
