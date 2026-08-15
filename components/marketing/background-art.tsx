/**
 * Ambient geometry behind the hero.
 *
 * A large area of flat colour reads as unfinished; the same area with faint
 * structure behind it reads as spacious. Deliberately near-invisible — if you
 * notice it as a graphic it is too strong.
 *
 * Decorative only: aria-hidden, pointer-events-none, and it must never affect
 * layout. The drift animation is disabled by the global reduced-motion rule.
 */
export function BackgroundArt() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
    >
      <svg
        className="drift absolute top-1/2 left-1/2 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2"
        viewBox="0 0 1200 700"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* A span/arc motif — the "bridge" between a student and a company. */}
        <g stroke="var(--color-sky-200)" strokeWidth="1.25" opacity="0.85">
          <path d="M-40 470 Q 300 150 600 330 T 1240 200" />
          <path d="M-40 530 Q 320 230 600 390 T 1240 280" />
          <path d="M-40 590 Q 340 320 600 450 T 1240 370" />
        </g>

        {/* Verticals, like cables — irregular spacing so it reads drawn. */}
        <g stroke="var(--color-sky-200)" strokeWidth="1" opacity="0.5">
          {[180, 300, 420, 600, 780, 900, 1020].map((x) => (
            <line key={x} x1={x} y1="120" x2={x} y2="640" />
          ))}
        </g>

        {/* Nodes at a few intersections — the "verified" points. */}
        <g fill="var(--color-sky-200)" opacity="0.9">
          {[
            [300, 268],
            [600, 330],
            [900, 258],
            [180, 372],
            [780, 300],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4.5" />
          ))}
        </g>

        <g stroke="var(--color-sky-200)" strokeWidth="1" opacity="0.35">
          <circle cx="600" cy="330" r="150" />
          <circle cx="600" cy="330" r="260" />
        </g>
      </svg>
    </div>
  );
}
