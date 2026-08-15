/**
 * Turns a YouTube / Vimeo / Loom / Drive link into an embeddable URL.
 *
 * Pure and dependency-free so it can be tested directly — the demo video is
 * the single most convincing artefact on a candidate profile, and a silently
 * broken embed costs us the thing companies actually look at.
 *
 * Returns null for anything unrecognised, so callers can fall back to a plain
 * external link rather than rendering an empty frame.
 */
export function toEmbedUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  // Only ever embed over https — an http iframe is blocked as mixed content.
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const id = url.searchParams.get("v");
    if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
    if (url.pathname.startsWith("/embed/")) {
      const embedId = url.pathname.slice("/embed/".length);
      if (embedId) return `https://www.youtube-nocookie.com/embed/${embedId}`;
    }
    if (url.pathname.startsWith("/shorts/")) {
      const shortId = url.pathname.slice("/shorts/".length);
      if (shortId) return `https://www.youtube-nocookie.com/embed/${shortId}`;
    }
  }

  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
  }

  if (host === "vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
  }

  if (host === "loom.com") {
    // Both /share/<id> and /embed/<id> resolve to the same embed.
    const id = url.pathname.split("/").filter(Boolean).pop();
    if (id) return `https://www.loom.com/embed/${id}`;
  }

  if (host === "drive.google.com") {
    const match = url.pathname.match(/\/file\/d\/([^/]+)/);
    if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
  }

  return null;
}
