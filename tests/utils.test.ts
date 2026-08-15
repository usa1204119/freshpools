import { describe, it, expect } from "vitest";
import {
  formatPaise,
  formatLpa,
  formatCtcRange,
  formatDate,
  formatDateRange,
  daysUntil,
  addDays,
  maskName,
  candidateHandle,
  slugify,
  generateJoinCode,
  pluralize,
  initials,
} from "@/lib/utils";

/**
 * These are the functions where a bug is silent and expensive: money shown to
 * a student, and the name masking that keeps a candidate anonymous until they
 * consent to an introduction.
 */

describe("formatPaise", () => {
  it("renders whole rupees without decimals", () => {
    expect(formatPaise(20000)).toBe("₹200");
    expect(formatPaise(10000)).toBe("₹100");
    expect(formatPaise(0)).toBe("₹0");
  });

  it("shows paise only when the amount is not a whole rupee", () => {
    expect(formatPaise(20050)).toBe("₹200.50");
    expect(formatPaise(1)).toBe("₹0.01");
  });

  it("uses the Indian digit grouping, not thousands", () => {
    // ₹1,50,000 — lakh grouping, not ₹150,000
    expect(formatPaise(15_000_000)).toBe("₹1,50,000");
  });

  it("never renders a fee as a bare number", () => {
    expect(formatPaise(20000)).toMatch(/^₹/);
  });
});

describe("formatLpa / formatCtcRange", () => {
  it("converts annual rupees to lakhs", () => {
    expect(formatLpa(600000)).toBe("₹6.0 LPA");
    expect(formatLpa(1250000)).toBe("₹12.5 LPA");
  });

  it("collapses a range when both ends match", () => {
    expect(formatCtcRange(600000, 600000)).toBe("₹6.0 LPA");
  });

  it("renders a spread as a range", () => {
    expect(formatCtcRange(600000, 900000)).toBe("₹6.0–9.0 LPA");
  });
});

describe("maskName", () => {
  it("keeps the first name and initialises the surname", () => {
    expect(maskName("Ananya Krishnan")).toBe("Ananya K.");
  });

  it("uses the LAST surname when there are several", () => {
    expect(maskName("Rohit Kumar Bansal")).toBe("Rohit B.");
  });

  it("obscures a single-word name rather than exposing it whole", () => {
    const masked = maskName("Meera");
    expect(masked).not.toBe("Meera");
    expect(masked).toContain("•");
  });

  it("tolerates untidy whitespace", () => {
    expect(maskName("  Asha   Menon  ")).toBe("Asha M.");
  });

  it("never leaks a full surname", () => {
    expect(maskName("Priya Raman")).not.toContain("Raman");
  });
});

describe("candidateHandle", () => {
  it("produces a stable FP- handle", () => {
    const handle = candidateHandle("clx1234abcd9");
    expect(handle).toMatch(/^FP-[A-Z0-9]{5}$/);
    expect(candidateHandle("clx1234abcd9")).toBe(handle);
  });

  it("pads a short id", () => {
    expect(candidateHandle("ab")).toMatch(/^FP-\d*AB$/);
  });

  it("does not expose the raw id", () => {
    const id = "clxsecretvalue";
    expect(candidateHandle(id)).not.toContain("secret");
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Build Sprint: Monsoon")).toBe("build-sprint-monsoon");
  });

  it("collapses repeated separators", () => {
    expect(slugify("A   B --- C")).toBe("a-b-c");
  });

  it("strips characters that are illegal in a URL", () => {
    expect(slugify("Hack@2026 #1!")).toBe("hack2026-1");
  });
});

describe("generateJoinCode", () => {
  it("returns the requested length", () => {
    expect(generateJoinCode()).toHaveLength(6);
    expect(generateJoinCode(8)).toHaveLength(8);
  });

  it("omits characters people confuse when reading a code aloud", () => {
    // No O/0 or I/1 — codes get shouted across a hall.
    for (let i = 0; i < 200; i += 1) {
      expect(generateJoinCode(12)).not.toMatch(/[O0I1]/);
    }
  });
});

describe("daysUntil / addDays", () => {
  it("counts forward to a future date", () => {
    const future = addDays(new Date(), 90);
    expect(daysUntil(future)).toBeGreaterThanOrEqual(89);
    expect(daysUntil(future)).toBeLessThanOrEqual(90);
  });

  it("goes negative once the date has passed", () => {
    expect(daysUntil(addDays(new Date(), -5))).toBeLessThan(0);
  });

  it("does not mutate the input date", () => {
    const original = new Date("2026-01-01T00:00:00Z");
    const copy = new Date(original);
    addDays(original, 30);
    expect(original.getTime()).toBe(copy.getTime());
  });
});

describe("formatDate / formatDateRange", () => {
  // Note: en-IN abbreviates September as "Sept", not "Sep".
  it("formats in IST regardless of the machine's timezone", () => {
    // 2026-09-14T20:00Z is 2026-09-15 01:30 IST — the IST date, not the UTC one.
    expect(formatDate("2026-09-14T20:00:00Z")).toBe("15 Sept 2026");
  });

  it("compacts a range inside one month", () => {
    expect(
      formatDateRange("2026-09-14T04:00:00Z", "2026-09-16T04:00:00Z"),
    ).toBe("14–16 Sept 2026");
  });

  it("spells out both ends when the range crosses a month", () => {
    const range = formatDateRange("2026-09-28T04:00:00Z", "2026-10-02T04:00:00Z");
    expect(range).toContain("Sep");
    expect(range).toContain("Oct");
  });

  it("decides same-month using IST, matching how it renders the days", () => {
    // 2026-08-31T20:00Z is 1 Sep IST; 2026-09-02T04:00Z is 2 Sep IST.
    // Both are September in IST, so this must not be reported as a
    // cross-month range using UTC months.
    const range = formatDateRange("2026-08-31T20:00:00Z", "2026-09-02T04:00:00Z");
    expect(range).toBe("1–2 Sept 2026");
  });
});

describe("pluralize / initials", () => {
  it("pluralizes regularly and irregularly", () => {
    expect(pluralize(1, "candidate")).toBe("candidate");
    expect(pluralize(2, "candidate")).toBe("candidates");
    expect(pluralize(2, "person", "people")).toBe("people");
  });

  it("takes at most two initials", () => {
    expect(initials("Asha Menon")).toBe("AM");
    expect(initials("Rohit Kumar Bansal")).toBe("RK");
  });
});
