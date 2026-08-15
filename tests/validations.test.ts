import { describe, it, expect } from "vitest";
import {
  eventSchema,
  requirementSchema,
  registrationSchema,
  submissionSchema,
  collegeEnquirySchema,
  candidateProfileSchema,
  scoreSchema,
  joinTeamSchema,
  readList,
} from "@/lib/validations";

/**
 * These schemas ARE the server boundary (NON-NEGOTIABLE #17), so the business
 * rules encoded in them get tested directly rather than through the UI.
 */

const year = new Date().getFullYear();

function validEvent(overrides: Record<string, unknown> = {}) {
  return {
    title: "Build Sprint",
    slug: "build-sprint",
    problemStatement: "x".repeat(120),
    mode: "ONLINE",
    startAt: "2026-09-14T09:00",
    endAt: "2026-09-16T18:00",
    deadline: "2026-09-12T23:59",
    status: "DRAFT",
    minTeamSize: 2,
    maxTeamSize: 4,
    tracks: [],
    rules: [],
    registrationFee: 200,
    depositAmount: 100,
    isSponsoredFree: false,
    coverBlock: "blue",
    ...overrides,
  };
}

describe("eventSchema — money", () => {
  it("converts rupees typed by an admin into paise", () => {
    const parsed = eventSchema.parse(validEvent());
    expect(parsed.registrationFee).toBe(20000);
    expect(parsed.depositAmount).toBe(10000);
  });

  it("rejects a deposit larger than the entry fee", () => {
    const result = eventSchema.safeParse(
      validEvent({ registrationFee: 100, depositAmount: 200 }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("depositAmount"))).toBe(true);
    }
  });

  it("allows a deposit equal to the fee (fully refundable)", () => {
    expect(
      eventSchema.safeParse(validEvent({ registrationFee: 200, depositAmount: 200 })).success,
    ).toBe(true);
  });
});

describe("eventSchema — dates", () => {
  it("interprets a datetime-local string as IST, not server-local", () => {
    const parsed = eventSchema.parse(validEvent({ startAt: "2026-09-14T09:00" }));
    // 09:00 IST is 03:30 UTC — this must hold on any machine.
    expect(parsed.startAt.toISOString()).toBe("2026-09-14T03:30:00.000Z");
  });

  it("rejects an event that ends before it starts", () => {
    const result = eventSchema.safeParse(
      validEvent({ startAt: "2026-09-16T09:00", endAt: "2026-09-14T09:00" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a registration deadline after kickoff", () => {
    const result = eventSchema.safeParse(
      validEvent({ deadline: "2026-09-15T09:00", startAt: "2026-09-14T09:00" }),
    );
    expect(result.success).toBe(false);
  });

  it("allows a deadline exactly at kickoff", () => {
    expect(
      eventSchema.safeParse(
        validEvent({ deadline: "2026-09-14T09:00", startAt: "2026-09-14T09:00" }),
      ).success,
    ).toBe(true);
  });
});

describe("eventSchema — structural rules", () => {
  it("rejects max team size below min", () => {
    expect(eventSchema.safeParse(validEvent({ minTeamSize: 4, maxTeamSize: 2 })).success).toBe(
      false,
    );
  });

  it("requires a venue or host college for an offline event", () => {
    expect(eventSchema.safeParse(validEvent({ mode: "OFFLINE" })).success).toBe(false);
    expect(
      eventSchema.safeParse(validEvent({ mode: "OFFLINE", venue: "Main Hall" })).success,
    ).toBe(true);
    expect(
      eventSchema.safeParse(validEvent({ mode: "OFFLINE", collegeId: "c1" })).success,
    ).toBe(true);
  });

  it("requires a sponsor when entry is free — the banner names them", () => {
    expect(eventSchema.safeParse(validEvent({ isSponsoredFree: true })).success).toBe(false);
    expect(
      eventSchema.safeParse(validEvent({ isSponsoredFree: true, sponsorId: "co1" })).success,
    ).toBe(true);
  });

  it("rejects a slug that is not URL-safe", () => {
    expect(eventSchema.safeParse(validEvent({ slug: "Build Sprint" })).success).toBe(false);
    expect(eventSchema.safeParse(validEvent({ slug: "build--sprint" })).success).toBe(false);
    expect(eventSchema.safeParse(validEvent({ slug: "build-sprint-2026" })).success).toBe(true);
  });

  it("rejects a stub problem statement", () => {
    expect(eventSchema.safeParse(validEvent({ problemStatement: "TODO" })).success).toBe(false);
  });
});

describe("registrationSchema", () => {
  const valid = {
    eventSlug: "build-sprint",
    college: "Sample Institute",
    gradYear: year + 1,
    phone: "9876543210",
    github: "https://github.com/someone",
    skills: ["React"],
    tshirtSize: "M",
  };

  it("accepts a well-formed registration", () => {
    expect(registrationSchema.safeParse(valid).success).toBe(true);
  });

  it("has NO amount field — the price is never client-supplied", () => {
    const parsed = registrationSchema.parse({ ...valid, registrationFee: 1, amount: 1 });
    expect(parsed).not.toHaveProperty("amount");
    expect(parsed).not.toHaveProperty("registrationFee");
  });

  it("rejects a non-Indian mobile number", () => {
    expect(registrationSchema.safeParse({ ...valid, phone: "1234567890" }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...valid, phone: "98765" }).success).toBe(false);
  });

  it("accepts a +91 prefix", () => {
    expect(registrationSchema.safeParse({ ...valid, phone: "+91 9876543210" }).success).toBe(
      true,
    );
  });

  it("rejects a repository URL where a profile is expected", () => {
    expect(
      registrationSchema.safeParse({
        ...valid,
        github: "https://github.com/someone/project",
      }).success,
    ).toBe(false);
  });
});

describe("requirementSchema", () => {
  const valid = {
    companyName: "Cobalt Systems",
    contactPerson: "Priya",
    email: "p@example.com",
    phone: "9876543210",
    role: "Backend Engineer",
    stack: ["Node.js"],
    openings: 2,
    ctcMin: 600000,
    ctcMax: 900000,
    location: "Bengaluru",
    isRemote: false,
    urgency: "1_MONTH",
    sponsorInterest: "maybe",
  };

  it("accepts a well-formed requirement", () => {
    expect(requirementSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an inverted CTC range", () => {
    const result = requirementSchema.safeParse({ ...valid, ctcMin: 900000, ctcMax: 600000 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("ctcMax"))).toBe(true);
    }
  });

  it("normalises email case", () => {
    const parsed = requirementSchema.parse({ ...valid, email: "P@Example.COM" });
    expect(parsed.email).toBe("p@example.com");
  });
});

describe("submissionSchema", () => {
  const valid = {
    teamId: "t1",
    title: "Clinic Queue",
    description: "x".repeat(100),
    repoUrl: "https://github.com/team/project",
    videoUrl: "https://youtube.com/watch?v=abc",
    stack: ["React"],
    contributions: "x".repeat(80),
  };

  it("accepts a complete submission", () => {
    expect(submissionSchema.safeParse(valid).success).toBe(true);
  });

  it("requires a real contributions breakdown, not a placeholder", () => {
    expect(submissionSchema.safeParse({ ...valid, contributions: "everyone" }).success).toBe(
      false,
    );
  });

  it("rejects a profile URL where a repository is expected", () => {
    expect(
      submissionSchema.safeParse({ ...valid, repoUrl: "https://github.com/team" }).success,
    ).toBe(false);
  });

  it("requires a demo video — it is mandatory", () => {
    expect(submissionSchema.safeParse({ ...valid, videoUrl: "" }).success).toBe(false);
  });
});

describe("scoreSchema", () => {
  const valid = {
    submissionId: "s1",
    candidateId: "c1",
    demo: 30,
    code: 25,
    fit: 25,
    viva: 20,
    inTalentPool: true,
  };

  it("accepts a full-marks score", () => {
    expect(scoreSchema.safeParse(valid).success).toBe(true);
  });

  it("enforces each criterion's own maximum, matching the public rubric", () => {
    expect(scoreSchema.safeParse({ ...valid, demo: 31 }).success).toBe(false);
    expect(scoreSchema.safeParse({ ...valid, code: 26 }).success).toBe(false);
    expect(scoreSchema.safeParse({ ...valid, fit: 26 }).success).toBe(false);
    expect(scoreSchema.safeParse({ ...valid, viva: 21 }).success).toBe(false);
  });

  it("rejects negative scores", () => {
    expect(scoreSchema.safeParse({ ...valid, demo: -1 }).success).toBe(false);
  });
});

describe("joinTeamSchema", () => {
  it("upper-cases a lowercase join code", () => {
    const parsed = joinTeamSchema.parse({ eventSlug: "e", joinCode: "ab3k9z" });
    expect(parsed.joinCode).toBe("AB3K9Z");
  });

  it("rejects a code of the wrong length", () => {
    expect(joinTeamSchema.safeParse({ eventSlug: "e", joinCode: "AB3K9" }).success).toBe(false);
  });
});

describe("candidateProfileSchema", () => {
  const valid = {
    name: "Asha Menon",
    phone: "9876543210",
    college: "Sample Institute",
    gradYear: year + 1,
    github: "https://github.com/asha",
    skills: ["React"],
  };

  it("accepts a minimal profile", () => {
    expect(candidateProfileSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an implausible graduation year", () => {
    expect(candidateProfileSchema.safeParse({ ...valid, gradYear: 1990 }).success).toBe(false);
    expect(candidateProfileSchema.safeParse({ ...valid, gradYear: year + 20 }).success).toBe(
      false,
    );
  });

  it("requires at least one skill", () => {
    expect(candidateProfileSchema.safeParse({ ...valid, skills: [] }).success).toBe(false);
  });
});

describe("collegeEnquirySchema", () => {
  it("accepts an enquiry without optional fields", () => {
    expect(
      collegeEnquirySchema.safeParse({
        collegeName: "Sample Institute",
        city: "Pune",
        contactName: "TPO",
        contactRole: "TPO / Placement Officer",
        email: "tpo@example.edu",
        interestedIn: "BOTH",
      }).success,
    ).toBe(true);
  });
});

describe("readList", () => {
  it("splits, trims and de-duplicates repeated fields", () => {
    const form = new FormData();
    form.append("skills", "React");
    form.append("skills", " Node.js , React ");
    expect(readList(form, "skills")).toEqual(["React", "Node.js"]);
  });

  it("drops empty entries", () => {
    const form = new FormData();
    form.append("skills", " , , ");
    expect(readList(form, "skills")).toEqual([]);
  });
});
