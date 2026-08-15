import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt =
  "FreshPools — hire freshers who have already built something";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Generated rather than shipped as a file, so the card always matches the
 * design system.
 *
 * Satori has no system fonts: whatever you embed becomes the entire available
 * set, and anything you don't embed silently falls back to what you did. That
 * means the mixed serif/sans headline — the brand signature — needs BOTH faces
 * embedded, or the whole card renders in one of them.
 *
 * Satoshi is not on Google Fonts, so Inter stands in for it here. If any fetch
 * fails the card still renders in Satori's default face rather than 500-ing a
 * social preview.
 */
async function loadGoogleFont(query: string): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${query}&display=swap`,
      // A desktop UA makes Google serve .ttf rather than .woff2, which Satori
      // cannot parse.
      { headers: { "User-Agent": "Mozilla/5.0" } },
    ).then((response) => response.text());

    const url = css.match(/src:\s*url\((https:\/\/[^)]+)\)/)?.[1];
    if (!url) return null;

    const font = await fetch(url);
    if (!font.ok) return null;
    return await font.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const [serif, sans, sansBold] = await Promise.all([
    loadGoogleFont("Instrument+Serif"),
    loadGoogleFont("Inter:wght@400"),
    loadGoogleFont("Inter:wght@700"),
  ]);

  const fonts = [
    serif && {
      name: "Instrument Serif",
      data: serif,
      style: "normal" as const,
      weight: 400 as const,
    },
    sans && { name: "Inter", data: sans, style: "normal" as const, weight: 400 as const },
    sansBold && {
      name: "Inter",
      data: sansBold,
      style: "normal" as const,
      weight: 700 as const,
    },
  ].filter(Boolean) as {
    name: string;
    data: ArrayBuffer;
    style: "normal";
    weight: 400 | 700;
  }[];

  // Only claim the serif family if it actually loaded, otherwise the headline
  // would silently render in whatever font Satori substitutes.
  const serifFamily = serif ? "Instrument Serif" : "Inter";
  const sansFamily = sans ? "Inter" : "Instrument Serif";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#E3EDFB",
          color: "#111111",
          padding: 72,
          justifyContent: "space-between",
          fontFamily: sansFamily,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span
            style={{
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              fontFamily: sansFamily,
            }}
          >
            FreshPools
          </span>
          <span
            style={{
              fontSize: 16,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              border: "1px solid #111111",
              padding: "6px 12px",
              fontFamily: sansFamily,
            }}
          >
            freshpools.in
          </span>
        </div>

        {/* The signature: serif · heavy sans · serif */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 76,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              maxWidth: 940,
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontFamily: serifFamily }}>
              Hire freshers who have&nbsp;
            </span>
            <span
              style={{
                fontFamily: sansFamily,
                fontWeight: 700,
                letterSpacing: "-0.03em",
              }}
            >
              already built&nbsp;
            </span>
            <span style={{ fontFamily: serifFamily }}>something.</span>
          </div>

          <div
            style={{
              fontSize: 25,
              color: "#5C5A55",
              maxWidth: 820,
              fontFamily: sansFamily,
            }}
          >
            Shipped working code in a live competition. Passed a code review.
            Explained it on camera.
          </div>
        </div>

        {/* Three flat blocks, mirroring the card system */}
        <div
          style={{
            display: "flex",
            gap: 1,
            backgroundColor: "#111111",
            border: "1px solid #111111",
          }}
        >
          {[
            // Kept short so each fits on one line — a wrapped label makes the
            // three blocks different heights.
            { bg: "#BDD7F5", label: "Built under pressure" },
            { bg: "#FFFFFF", label: "Human code review" },
            { bg: "#FAE243", label: "Recorded viva" },
          ].map((block) => (
            <div
              key={block.label}
              style={{
                flex: 1,
                backgroundColor: block.bg,
                padding: "24px 26px",
                fontSize: 19,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                display: "flex",
                whiteSpace: "nowrap",
                fontFamily: sansFamily,
              }}
            >
              {block.label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length > 0 ? fonts : undefined },
  );
}
