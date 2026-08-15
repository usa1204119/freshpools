import type { Metadata } from "next";
import Link from "next/link";
import { MixedHeadline } from "@/components/marketing/mixed-headline";
import { PageHero } from "@/components/marketing/page-hero";
import { UpcomingEventCard, PastEventCard } from "@/components/marketing/event-card";
import { StudentsNeverPayNote } from "@/components/marketing/fee-display";
import { Reveal } from "@/components/marketing/reveal";
import { Block, blockAt } from "@/components/ui/block";
import { getPastEvents, getUpcomingEvents } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Competitive coding events run by FreshPools. Build under pressure, get your code reviewed, and leave with a verified profile.",
};

type SearchParams = Promise<{ mode?: string; city?: string }>;

export default async function HackathonsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const mode = params.mode?.toUpperCase();
  const city = params.city;

  const [upcomingAll, pastAll] = await Promise.all([
    getUpcomingEvents(),
    getPastEvents(),
  ]);

  // Cities are derived from real events only — no hardcoded city list.
  const cities = Array.from(
    new Set(
      [...upcomingAll, ...pastAll]
        .map((event) => event.city ?? event.college?.city)
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort();

  const matches = (event: (typeof upcomingAll)[number]) => {
    if (mode === "ONLINE" && event.mode !== "ONLINE") return false;
    if (mode === "OFFLINE" && event.mode !== "OFFLINE") return false;
    if (city && (event.city ?? event.college?.city) !== city) return false;
    return true;
  };

  const upcoming = upcomingAll.filter(matches);
  const past = pastAll.filter(matches);
  const hasAnyEvent = upcomingAll.length + pastAll.length > 0;

  const buildHref = (next: { mode?: string; city?: string }) => {
    const query = new URLSearchParams();
    const nextMode = next.mode ?? (mode ? mode.toLowerCase() : undefined);
    const nextCity = next.city ?? city;
    if (nextMode && nextMode !== "all") query.set("mode", nextMode);
    if (nextCity && nextCity !== "all") query.set("city", nextCity);
    const qs = query.toString();
    return qs ? `/hackathons?${qs}` : "/hackathons";
  };

  return (
    <>
      <PageHero
        eyebrow="Events"
        headline="Competitions that **actually get reviewed.**"
        sub="Every event ends the same way: a code review by a human, a recorded viva, and a verified profile you keep whether you win or not."
      />

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      {hasAnyEvent ? (
        <section aria-label="Filter events" className="sticky top-16 z-30 border-b border-line-soft bg-paper/90 backdrop-blur-md lg:top-20">
          <div className="container-x flex flex-wrap items-center gap-x-8 gap-y-4 py-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="mono text-eyebrow text-ink-muted">Mode</span>
              {[
                { value: "all", label: "All" },
                { value: "online", label: "Online" },
                { value: "offline", label: "Offline" },
              ].map((option) => {
                const active =
                  option.value === "all" ? !mode : mode === option.value.toUpperCase();
                return (
                  <Link
                    key={option.value}
                    href={buildHref({ mode: option.value })}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "mono rounded-full border border-line-mid px-3 py-1.5 text-eyebrow",
                      active ? "bg-ink text-white" : "bg-block-white text-ink",
                    )}
                  >
                    {option.label}
                  </Link>
                );
              })}
            </div>

            {cities.length > 0 ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="mono text-eyebrow text-ink-muted">City</span>
                <Link
                  href={buildHref({ city: "all" })}
                  className={cn(
                    "mono rounded-full border border-line-mid px-3 py-1.5 text-eyebrow",
                    !city ? "bg-ink text-white" : "bg-block-white text-ink",
                  )}
                >
                  All
                </Link>
                {cities.map((name) => (
                  <Link
                    key={name}
                    href={buildHref({ city: name })}
                    className={cn(
                      "mono rounded-full border border-line-mid px-3 py-1.5 text-eyebrow",
                      city === name ? "bg-ink text-white" : "bg-block-white text-ink",
                    )}
                  >
                    {name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ── Upcoming ─────────────────────────────────────────────────────────
          Tighter top padding than the standard section rhythm: this sits
          directly under the filter bar, and a full 120px gap reads as a
          rendering fault rather than breathing room. */}
      <section
        className="bg-paper pt-12 pb-16 lg:pt-16 lg:pb-24"
        aria-labelledby="upcoming-title"
      >
        <div className="container-x">
          <MixedHeadline
            id="upcoming-title"
            text="**Upcoming**"
            as="h2"
            size="h3"
            className="mb-10"
          />

          {upcoming.length > 0 ? (
            /* Real gaps with self-bordered cards, not the gap-px/bg-ink trick
               used elsewhere: that paints gaps with the container background,
               so any empty cell in a part-filled grid renders as a solid black
               rectangle. Card counts here are variable, so it cannot be used. */
            <div className="grid gap-6 lg:grid-cols-2">
              {upcoming.map((event, index) => (
                <Reveal key={event.id} delay={index * 0.05}>
                  <UpcomingEventCard event={event} color={blockAt(index)} />
                </Reveal>
              ))}
            </div>
          ) : (
            <Block color="white" className="p-10">
              <p className="hl-serif text-[22px] text-ink-muted">
                {hasAnyEvent
                  ? "No events match that filter right now."
                  : "The next event is being scheduled. Nothing to show yet."}
              </p>
              <p className="mt-4 text-[15px] text-ink-muted">
                {hasAnyEvent ? (
                  <Link href="/hackathons" className="underline underline-offset-4">
                    Clear filters
                  </Link>
                ) : (
                  <>
                    Colleges and sponsors:{" "}
                    <Link href="/for-colleges" className="underline underline-offset-4">
                      talk to us about hosting one
                    </Link>
                    .
                  </>
                )}
              </p>
            </Block>
          )}
        </div>
      </section>

      {/* ── Past ───────────────────────────────────────────────────────────── */}
      {past.length > 0 ? (
        <section className="section-y border-t border-line-soft wash-soft" aria-labelledby="past-title">
          <div className="container-x">
            <MixedHeadline
              id="past-title"
              text="**Past events**"
              as="h2"
              size="h3"
              className="mb-10"
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((event, index) => (
                <PastEventCard key={event.id} event={event} color={blockAt(index)} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section-y bg-paper">
        <div className="container-x">
          <StudentsNeverPayNote />
        </div>
      </section>
    </>
  );
}
