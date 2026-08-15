import { Eyebrow } from "./mixed-headline";

/**
 * NON-NEGOTIABLE #12: never render fake logos. The caller passes real partner
 * names or an empty array — an empty array renders nothing at all.
 *
 * Company names are TEXT (Satoshi 500, 18px), not images. Infinite 40s scroll,
 * paused on hover, static under prefers-reduced-motion (handled in globals.css
 * by the global animation kill switch).
 */
export function LogoMarquee({
  partners,
  eyebrow = "Hiring partners",
}: {
  partners: string[];
  eyebrow?: string;
}) {
  if (partners.length === 0) return null;

  // Duplicate the row so the -50% translate loops seamlessly.
  const track = [...partners, ...partners];

  return (
    <section
      aria-label="Hiring partners"
      className="border-y border-line-soft bg-paper py-12"
    >
      <Eyebrow className="mb-9 justify-center">{eyebrow}</Eyebrow>

      {/* Fades at both edges instead of a hard cut — the row should read as
          continuing past the viewport, not as a clipped list. */}
      <div className="marquee-mask relative overflow-hidden" data-marquee>
        <ul className="marquee-track flex w-max items-center gap-16 pr-16">
          {track.map((name, index) => (
            <li
              key={`${name}-${index}`}
              className="shrink-0 font-sans text-[18px] font-medium whitespace-nowrap text-ink"
              aria-hidden={index >= partners.length ? "true" : undefined}
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
