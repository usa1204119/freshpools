import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Money is stored in paise everywhere (Razorpay's unit). Never store rupees.
 * 20000 → "₹200"   ·   20050 → "₹200.50"
 */
export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  const hasPaise = paise % 100 !== 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: hasPaise ? 2 : 0,
  }).format(rupees);
}

/** CTC is stored in rupees per annum. 600000 → "₹6.0 LPA" */
export function formatLpa(rupees: number): string {
  return `₹${(rupees / 100000).toFixed(1)} LPA`;
}

export function formatCtcRange(min: number, max: number): string {
  if (min === max) return formatLpa(min);
  return `₹${(min / 100000).toFixed(1)}–${(max / 100000).toFixed(1)} LPA`;
}

const DATE_TZ = "Asia/Kolkata";

export function formatDate(date: Date | string, withTime = false): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit", hour12: true } : {}),
    timeZone: DATE_TZ,
  }).format(d);
}

/**
 * The calendar month/year as seen in IST.
 *
 * `getUTCMonth()` is NOT a safe substitute: IST is UTC+5:30, so 31 Aug 20:00Z
 * is already 1 Sep in India. Comparing UTC months while rendering IST days made
 * a same-month range render in the long cross-month form.
 */
function istMonthKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DATE_TZ,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  return `${year}-${month}`;
}

/** "14–16 Sept 2026" when the months match, otherwise both months spelled out. */
export function formatDateRange(start: Date | string, end: Date | string): string {
  const s = typeof start === "string" ? new Date(start) : start;
  const e = typeof end === "string" ? new Date(end) : end;
  const sameMonth = istMonthKey(s) === istMonthKey(e);

  if (sameMonth) {
    const day = new Intl.DateTimeFormat("en-IN", { day: "numeric", timeZone: DATE_TZ });
    const rest = new Intl.DateTimeFormat("en-IN", {
      month: "short",
      year: "numeric",
      timeZone: DATE_TZ,
    });
    return `${day.format(s)}–${day.format(e)} ${rest.format(e)}`;
  }
  return `${formatDate(s)} – ${formatDate(e)}`;
}

/** Human gap used by the 90-day intro clearance timer. */
export function daysUntil(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  const ms = d.getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * NON-NEGOTIABLE #1: a company must never see a candidate's identity before
 * an admin-brokered intro. Teaser cards show a partial name only.
 * "Ananya Krishnan" → "Ananya K."
 */
export function maskName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    const [only] = parts;
    return `${only.slice(0, Math.min(3, only.length))}${"•".repeat(3)}`;
  }
  const [first, ...rest] = parts;
  const lastInitial = rest[rest.length - 1]?.[0] ?? "";
  return `${first} ${lastInitial}.`;
}

/** Anonymous handle used in company-facing views: "FP-4K2M9" */
export function candidateHandle(id: string): string {
  const tail = id.replace(/[^a-z0-9]/gi, "").slice(-5).toUpperCase();
  return `FP-${tail.padStart(5, "0")}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Team join codes: unambiguous alphabet (no O/0, I/1). */
export function generateJoinCode(length = 6): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
