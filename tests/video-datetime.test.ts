import { describe, it, expect } from "vitest";
import { toEmbedUrl } from "@/lib/video";
import { toIstInput } from "@/lib/datetime";
import { eventSchema } from "@/lib/validations";

describe("toEmbedUrl", () => {
  it("handles the standard YouTube watch URL", () => {
    expect(toEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
  });

  it("handles youtu.be short links", () => {
    expect(toEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
  });

  it("handles YouTube Shorts, which students actually paste", () => {
    expect(toEmbedUrl("https://www.youtube.com/shorts/abc123")).toBe(
      "https://www.youtube-nocookie.com/embed/abc123",
    );
  });

  it("keeps extra query params out of the embed id", () => {
    expect(toEmbedUrl("https://www.youtube.com/watch?v=abc123&t=42s")).toBe(
      "https://www.youtube-nocookie.com/embed/abc123",
    );
  });

  it("always uses the no-cookie host", () => {
    expect(toEmbedUrl("https://www.youtube.com/watch?v=abc123")).toContain(
      "youtube-nocookie.com",
    );
  });

  it("handles Vimeo numeric ids only", () => {
    expect(toEmbedUrl("https://vimeo.com/123456789")).toBe(
      "https://player.vimeo.com/video/123456789",
    );
    expect(toEmbedUrl("https://vimeo.com/channels/staffpicks")).toBeNull();
  });

  it("handles Loom share and embed links", () => {
    expect(toEmbedUrl("https://www.loom.com/share/abc123")).toBe(
      "https://www.loom.com/embed/abc123",
    );
  });

  it("handles a Google Drive file link", () => {
    expect(toEmbedUrl("https://drive.google.com/file/d/FILEID/view?usp=sharing")).toBe(
      "https://drive.google.com/file/d/FILEID/preview",
    );
  });

  it("returns null for anything unrecognised, so the caller can link out", () => {
    expect(toEmbedUrl("https://example.com/video.mp4")).toBeNull();
    expect(toEmbedUrl("not a url")).toBeNull();
    expect(toEmbedUrl("")).toBeNull();
  });

  it("refuses non-http protocols", () => {
    expect(toEmbedUrl("javascript:alert(1)")).toBeNull();
    expect(toEmbedUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
  });
});

describe("IST datetime round-trip", () => {
  /**
   * `toIstInput` and the schema's `istDateTime` are two halves of one
   * conversion. If they disagree, every event silently shifts by 5.5 hours
   * between local and production — so they are tested together.
   */
  function roundTrip(input: string) {
    const parsed = eventSchema.parse({
      title: "Test",
      slug: "test",
      problemStatement: "x".repeat(120),
      mode: "ONLINE",
      startAt: input,
      endAt: "2027-01-01T10:00",
      deadline: "2026-01-01T10:00",
      status: "DRAFT",
      minTeamSize: 2,
      maxTeamSize: 4,
      tracks: [],
      rules: [],
      registrationFee: 200,
      depositAmount: 100,
      isSponsoredFree: false,
      coverBlock: "blue",
    });
    return toIstInput(parsed.startAt);
  }

  it("returns the same wall-clock string it was given", () => {
    expect(roundTrip("2026-09-14T09:00")).toBe("2026-09-14T09:00");
  });

  it("survives a time that crosses midnight UTC", () => {
    // 03:00 IST is 21:30 the previous day in UTC.
    expect(roundTrip("2026-09-14T03:00")).toBe("2026-09-14T03:00");
  });

  it("survives a time that crosses a month boundary in UTC", () => {
    // 01:00 IST on 1 Sep is 19:30 on 31 Aug UTC.
    expect(roundTrip("2026-09-01T01:00")).toBe("2026-09-01T01:00");
  });

  it("survives a year boundary", () => {
    expect(roundTrip("2027-01-01T02:00")).toBe("2027-01-01T02:00");
  });

  it("returns undefined for a missing date", () => {
    expect(toIstInput(null)).toBeUndefined();
    expect(toIstInput(undefined)).toBeUndefined();
  });
});
