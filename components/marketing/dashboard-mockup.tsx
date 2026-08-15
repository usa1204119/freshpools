/**
 * Static visual only — this is illustration, not live data, and it is labelled
 * as such for screen readers. Three stat tiles inside one bordered frame.
 */
export function DashboardMockup() {
  return (
    <div
      role="img"
      aria-label="Illustration of the FreshPools company dashboard showing a verification rate, the next event date, and a role pipeline status."
      /* The one place a large radius is the point: this reads as a device, and
         the soft elevation is what lifts it off the section boundary. */
      className="overflow-hidden rounded-xl border border-line-soft bg-block-white shadow-lg"
    >
      {/* Frame chrome */}
      <div className="flex items-center justify-between gap-4 border-b border-line-soft px-5 py-3.5">
        <p className="mono text-eyebrow">Freshpools · Company view</p>
        <p className="mono text-eyebrow text-ink-muted" aria-hidden="true">
          Illustration
        </p>
      </div>

      <div className="grid gap-px bg-line-soft sm:grid-cols-3">
        {/* Yellow tile: a % metric with a flat progress bar */}
        <div className="bg-block-yellow p-6">
          <p className="mono text-eyebrow">Shortlist accuracy</p>
          <p className="mt-4 font-sans text-[44px] leading-none font-bold tracking-[-0.03em]">
            82%
          </p>
          <div
            className="mt-5 h-3 overflow-hidden rounded-full border border-ink/25"
            aria-hidden="true"
          >
            <div className="h-full w-[82%] rounded-full bg-ink" />
          </div>
          <p className="mono mt-3 text-eyebrow text-ink-muted">
            Reached interview round
          </p>
        </div>

        {/* White tile: next event / date */}
        <div className="bg-block-white p-6">
          <p className="mono text-eyebrow">Next event</p>
          <p className="mt-4 font-sans text-[26px] leading-tight font-bold tracking-[-0.02em]">
            Build Sprint
          </p>
          <p className="hl-serif mt-1 text-[20px] text-ink-muted">Pune · Offline</p>
          <div className="mt-5 border-t border-line-soft pt-3">
            <p className="mono text-eyebrow text-ink-muted">Submissions close</p>
            <p className="mono mt-1 text-label">18 Sep · 23:59 IST</p>
          </div>
        </div>

        {/* Ink tile: target role / status — white text on black */}
        <div className="bg-block-ink p-6 text-white">
          <p className="mono text-eyebrow text-white/70">Open requirement</p>
          <p className="mt-4 font-sans text-[26px] leading-tight font-bold tracking-[-0.02em]">
            Backend Engineer
          </p>
          <p className="hl-serif mt-1 text-[20px] text-white/70">
            3 openings · Remote
          </p>
          <div className="mt-5 border-t border-white/40 pt-3">
            <span className="mono inline-block border border-white px-2 py-1 text-eyebrow">
              Shortlist sent
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
