import { z } from "zod";

/**
 * NON-NEGOTIABLE #17: every form is Zod-validated, and the SAME schema runs on
 * the server. Client validation is a convenience; these schemas are the
 * boundary.
 */

const email = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("That doesn't look like an email address")
  .toLowerCase();

const phone = z
  .string()
  .trim()
  .regex(/^(\+91[-\s]?)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");

const url = z.string().trim().url("Enter a full URL, including https://");

const githubUrl = url.refine(
  (value) => /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/?$/i.test(value),
  "Enter your GitHub profile URL, e.g. https://github.com/yourname",
);

/* ── Auth ────────────────────────────────────────────────────────────────── */

export const requestOtpSchema = z.object({
  email,
  intendedRole: z.enum(["CANDIDATE", "COMPANY"]).default("CANDIDATE"),
  name: z.string().trim().max(80).optional(),
});
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;

export const verifyOtpSchema = z.object({
  email,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
  name: z.string().trim().max(80).optional(),
  intendedRole: z.enum(["CANDIDATE", "COMPANY"]).default("CANDIDATE"),
  next: z.string().trim().optional(),
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

/* ── Candidate onboarding & profile ──────────────────────────────────────── */

const currentYear = new Date().getFullYear();

export const candidateProfileSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  phone,
  college: z.string().trim().min(2, "Enter your college name").max(140),
  gradYear: z.coerce
    .number()
    .int()
    .min(currentYear - 6, "That graduation year looks too far back")
    .max(currentYear + 6, "That graduation year looks too far ahead"),
  github: githubUrl,
  linkedin: url.optional().or(z.literal("")),
  skills: z
    .array(z.string().trim().min(1).max(30))
    .min(1, "Add at least one skill")
    .max(12, "Twelve skills is plenty — pick the ones you'd defend in a viva"),
  resumeUrl: url.optional().or(z.literal("")),
  videoUrl: url.optional().or(z.literal("")),
  availability: z.enum(["LOOKING", "OPEN", "PLACED"]).default("LOOKING"),
});
export type CandidateProfileInput = z.infer<typeof candidateProfileSchema>;

/* ── Event registration ──────────────────────────────────────────────────── */

export const registrationSchema = z.object({
  eventSlug: z.string().trim().min(1),
  college: z.string().trim().min(2, "Enter your college name").max(140),
  gradYear: z.coerce.number().int().min(currentYear - 6).max(currentYear + 6),
  phone,
  github: githubUrl,
  skills: z.array(z.string().trim().min(1).max(30)).min(1, "Add at least one skill"),
  tshirtSize: z.enum(["XS", "S", "M", "L", "XL", "XXL"]),
  /**
   * Deliberately absent: any amount field. The fee is read from the Event row
   * on the server so a crafted request cannot set its own price.
   */
});
export type RegistrationInput = z.infer<typeof registrationSchema>;

export const createTeamSchema = z.object({
  eventSlug: z.string().trim().min(1),
  name: z
    .string()
    .trim()
    .min(2, "Team name is too short")
    .max(40, "Keep the team name under 40 characters"),
});

export const joinTeamSchema = z.object({
  eventSlug: z.string().trim().min(1),
  joinCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{6}$/, "Join codes are 6 characters"),
});

/* ── Submission ──────────────────────────────────────────────────────────── */

export const submissionSchema = z.object({
  teamId: z.string().trim().min(1),
  title: z.string().trim().min(3, "Give the project a title").max(80),
  description: z
    .string()
    .trim()
    .min(80, "Describe what you built in at least 80 characters")
    .max(3000),
  repoUrl: url.refine(
    (value) => /^https?:\/\/(www\.)?(github|gitlab)\.com\/[\w.-]+\/[\w.-]+\/?$/i.test(value),
    "Link the public repository, e.g. https://github.com/you/project",
  ),
  videoUrl: url,
  stack: z.array(z.string().trim().min(1).max(30)).min(1, "List your stack"),
  contributions: z
    .string()
    .trim()
    .min(60, "Break down who built what — this is read during the viva")
    .max(3000),
});
export type SubmissionInput = z.infer<typeof submissionSchema>;

/* ── Company requirement (public, no login) ──────────────────────────────── */

export const requirementSchema = z
  .object({
    companyName: z.string().trim().min(2, "Enter your company name").max(120),
    website: url.optional().or(z.literal("")),
    contactPerson: z.string().trim().min(2, "Enter your name").max(80),
    email,
    phone,
    role: z.string().trim().min(2, "Enter the role title").max(120),
    stack: z.array(z.string().trim().min(1).max(30)).min(1, "Add at least one technology"),
    openings: z.coerce.number().int().min(1, "At least one opening").max(200),
    ctcMin: z.coerce.number().int().min(100000, "Enter the annual CTC in rupees"),
    ctcMax: z.coerce.number().int().min(100000, "Enter the annual CTC in rupees"),
    location: z.string().trim().min(2, "Enter a location").max(80),
    isRemote: z.boolean().default(false),
    urgency: z.enum(["IMMEDIATE", "1_MONTH", "3_MONTHS"]),
    sponsorInterest: z.enum(["yes", "maybe", "no"]),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
  })
  .refine((data) => data.ctcMax >= data.ctcMin, {
    message: "Maximum CTC must be at least the minimum",
    path: ["ctcMax"],
  });
export type RequirementInput = z.infer<typeof requirementSchema>;

/* ── College enquiry ─────────────────────────────────────────────────────── */

export const collegeEnquirySchema = z.object({
  collegeName: z.string().trim().min(2, "Enter your college name").max(140),
  city: z.string().trim().min(2, "Enter your city").max(80),
  contactName: z.string().trim().min(2, "Enter your name").max(80),
  contactRole: z.string().trim().min(2, "Tell us your role").max(80),
  email,
  phone: phone.optional().or(z.literal("")),
  studentCount: z.coerce.number().int().min(1).max(20000).optional(),
  department: z.string().trim().max(120).optional().or(z.literal("")),
  preferredMonth: z.string().trim().max(40).optional().or(z.literal("")),
  interestedIn: z.enum(["HACKATHON", "WORKSHOP", "BOTH"]),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});
export type CollegeEnquiryInput = z.infer<typeof collegeEnquirySchema>;

/* ── Events (admin) ──────────────────────────────────────────────────────── */

/**
 * `<input type="datetime-local">` submits "2026-09-14T09:00" with no timezone.
 * `new Date()` would then interpret it in the SERVER's zone — UTC on Vercel,
 * IST locally — silently shifting every event by 5.5 hours between
 * environments. FreshPools runs in India, so we pin the offset explicitly.
 */
const IST_OFFSET = "+05:30";

const istDateTime = z
  .string()
  .trim()
  .min(1, "Pick a date and time")
  .transform((value, ctx) => {
    const withZone = /[+-]\d{2}:\d{2}$|Z$/.test(value) ? value : `${value}${IST_OFFSET}`;
    const date = new Date(withZone);
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "That's not a valid date" });
      return z.NEVER;
    }
    return date;
  });

/** Admins type rupees; everything downstream stores paise. */
const rupeesToPaise = z.coerce
  .number()
  .min(0, "Cannot be negative")
  .max(10_000_000, "That looks too large")
  .transform((rupees) => Math.round(rupees * 100));

export const eventSchema = z
  .object({
    id: z.string().trim().optional(),
    title: z.string().trim().min(3, "Give the event a title").max(120),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only")
      .min(3)
      .max(80),
    tagline: z.string().trim().max(160).optional().or(z.literal("")),
    problemStatement: z
      .string()
      .trim()
      .min(80, "Write at least a paragraph — this is what people build against")
      .max(20000),
    mode: z.enum(["ONLINE", "OFFLINE"]),
    venue: z.string().trim().max(160).optional().or(z.literal("")),
    city: z.string().trim().max(80).optional().or(z.literal("")),
    collegeId: z.string().trim().optional().or(z.literal("")),
    sponsorId: z.string().trim().optional().or(z.literal("")),
    startAt: istDateTime,
    endAt: istDateTime,
    deadline: istDateTime,
    status: z.enum([
      "DRAFT",
      "ANNOUNCED",
      "REGISTRATION_OPEN",
      "REGISTRATION_CLOSED",
      "LIVE",
      "JUDGING",
      "COMPLETED",
      "CANCELLED",
    ]),
    prizePool: rupeesToPaise.optional(),
    minTeamSize: z.coerce.number().int().min(1).max(10),
    maxTeamSize: z.coerce.number().int().min(1).max(10),
    tracks: z.array(z.string().trim().min(1).max(60)).max(8).default([]),
    rules: z.array(z.string().trim().min(1).max(300)).max(15).default([]),
    registrationFee: rupeesToPaise,
    depositAmount: rupeesToPaise,
    isSponsoredFree: z.boolean().default(false),
    coverBlock: z.enum(["blue", "coral", "yellow", "white"]).default("blue"),
  })
  // ── Business rules, enforced server-side so the UI cannot bypass them ──
  .refine((data) => data.endAt > data.startAt, {
    message: "The event must end after it starts",
    path: ["endAt"],
  })
  .refine((data) => data.deadline <= data.startAt, {
    message: "Registration must close on or before kickoff",
    path: ["deadline"],
  })
  .refine((data) => data.maxTeamSize >= data.minTeamSize, {
    message: "Maximum team size must be at least the minimum",
    path: ["maxTeamSize"],
  })
  .refine((data) => data.depositAmount <= data.registrationFee, {
    message: "The refundable deposit cannot exceed the entry fee",
    path: ["depositAmount"],
  })
  .refine((data) => data.mode === "ONLINE" || Boolean(data.venue || data.collegeId), {
    message: "An offline event needs a venue or a host college",
    path: ["venue"],
  })
  .refine((data) => !data.isSponsoredFree || Boolean(data.sponsorId), {
    message: "A sponsored-free event needs a sponsor — the banner names them",
    path: ["sponsorId"],
  });

export type EventInput = z.infer<typeof eventSchema>;

export const prizeSchema = z.object({
  eventId: z.string().trim().min(1),
  rank: z.string().trim().min(1, "Name the prize, e.g. 1st or Best UI").max(40),
  amount: rupeesToPaise.optional(),
  perk: z.string().trim().max(160).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(99).default(0),
});

/* ── Admin ───────────────────────────────────────────────────────────────── */

export const scoreSchema = z.object({
  submissionId: z.string().trim().min(1),
  candidateId: z.string().trim().min(1),
  demo: z.coerce.number().int().min(0).max(30),
  code: z.coerce.number().int().min(0).max(25),
  fit: z.coerce.number().int().min(0).max(25),
  viva: z.coerce.number().int().min(0).max(20),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  rank: z.coerce.number().int().min(1).max(999).optional(),
  tier: z.enum(["A", "B", "C"]).optional(),
  inTalentPool: z.boolean().default(false),
});
export type ScoreInput = z.infer<typeof scoreSchema>;

export const introSchema = z.object({
  requirementId: z.string().trim().min(1),
  candidateIds: z.array(z.string().trim().min(1)).min(1, "Pick at least one candidate"),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const introUpdateSchema = z.object({
  introId: z.string().trim().min(1),
  status: z.enum([
    "SENT",
    "ACCEPTED",
    "INTERVIEWING",
    "OFFERED",
    "JOINED",
    "CLEARED",
    "PAID",
    "REJECTED",
    "WITHDRAWN",
  ]),
  offerCtc: z.coerce.number().int().min(0).optional(),
  feeAmount: z.coerce.number().int().min(0).optional(),
  joinedAt: z.string().trim().optional().or(z.literal("")),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});

/* ── Shared helper for server actions ────────────────────────────────────── */

export type ActionState =
  | { status: "idle" }
  | { status: "success"; message?: string; redirectTo?: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> };

export function zodToFieldErrors(error: z.ZodError): Record<string, string[]> {
  const flat = error.flatten();
  return flat.fieldErrors as Record<string, string[]>;
}

/** Reads repeated form fields ("skills") into a trimmed, de-duplicated array. */
export function readList(formData: FormData, key: string): string[] {
  const raw = formData.getAll(key).flatMap((value) =>
    String(value)
      .split(",")
      .map((part) => part.trim()),
  );
  return Array.from(new Set(raw.filter(Boolean)));
}
