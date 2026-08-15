import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * NON-NEGOTIABLE #18: OTP and payment endpoints are rate limited.
 *
 * Upstash is optional in local development — without credentials we fall back
 * to an in-memory limiter. That fallback is per-instance and therefore NOT
 * safe for serverless production; `assertRateLimitConfigured()` is called at
 * build/startup of the payment routes to surface that loudly.
 */

const hasUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);

const redis = hasUpstash ? Redis.fromEnv() : null;

type Limiter = { limit: (key: string) => Promise<{ success: boolean; reset: number }> };

/** Sliding-window limiter used when Upstash is not configured. */
function memoryLimiter(max: number, windowMs: number): Limiter {
  const hits = new Map<string, number[]>();

  return {
    async limit(key: string) {
      const now = Date.now();
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      recent.push(now);
      hits.set(key, recent);

      // Opportunistic cleanup so the map cannot grow without bound.
      if (hits.size > 5000) {
        for (const [k, times] of hits) {
          if (times.every((t) => now - t >= windowMs)) hits.delete(k);
        }
      }

      return { success: recent.length <= max, reset: now + windowMs };
    },
  };
}

function build(max: number, window: `${number} ${"s" | "m" | "h"}`, prefix: string): Limiter {
  if (redis) {
    const ms = Ratelimit.slidingWindow(max, window);
    return new Ratelimit({ redis, limiter: ms, prefix, analytics: false });
  }
  const [count, unit] = window.split(" ") as [string, "s" | "m" | "h"];
  const multiplier = unit === "s" ? 1000 : unit === "m" ? 60_000 : 3_600_000;
  return memoryLimiter(max, Number(count) * multiplier);
}

/** 5 OTP requests per email per 10 minutes. */
export const otpRequestLimiter = build(5, "10 m", "fp:otp:req");
/** 10 verification attempts per email per 10 minutes. */
export const otpVerifyLimiter = build(10, "10 m", "fp:otp:verify");
/** 10 order creations per user per hour — payment retries are legitimate. */
export const paymentLimiter = build(10, "1 h", "fp:pay");
/** 5 public form submissions per IP per hour. */
export const formLimiter = build(5, "1 h", "fp:form");

export function isRateLimitDistributed(): boolean {
  return hasUpstash;
}

/** Best-effort client IP behind Vercel's proxy. */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
