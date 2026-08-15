import "server-only";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { prisma } from "./db";
import { OTP_LENGTH, OTP_MAX_ATTEMPTS, OTP_TTL_MINUTES } from "./otp-constants";

export { OTP_LENGTH, OTP_MAX_ATTEMPTS, OTP_TTL_MINUTES };

/** Cryptographically uniform 6-digit code. Math.random() is not acceptable. */
export function generateOtp(): string {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
}

/** Only the hash is ever persisted, so a database leak yields no live codes. */
export function hashOtp(email: string, code: string): string {
  return createHash("sha256")
    .update(`${email.toLowerCase()}:${code}:${process.env.AUTH_SECRET ?? ""}`)
    .digest("hex");
}

function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function issueOtp(email: string): Promise<string> {
  const normalized = email.toLowerCase().trim();
  const code = generateOtp();
  const token = hashOtp(normalized, code);

  // One live code per address — issuing a new one invalidates the old.
  await prisma.verificationToken.deleteMany({ where: { identifier: normalized } });
  await prisma.verificationToken.create({
    data: {
      identifier: normalized,
      token,
      expires: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
    },
  });

  return code;
}

export type OtpResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "expired" | "too_many_attempts" };

export async function verifyOtp(email: string, code: string): Promise<OtpResult> {
  const normalized = email.toLowerCase().trim();

  const record = await prisma.verificationToken.findFirst({
    where: { identifier: normalized },
    orderBy: { expires: "desc" },
  });

  if (!record) return { ok: false, reason: "invalid" };

  if (record.expires.getTime() < Date.now()) {
    await prisma.verificationToken.deleteMany({ where: { identifier: normalized } });
    return { ok: false, reason: "expired" };
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await prisma.verificationToken.deleteMany({ where: { identifier: normalized } });
    return { ok: false, reason: "too_many_attempts" };
  }

  const candidate = hashOtp(normalized, code.trim());

  if (!constantTimeEqual(candidate, record.token)) {
    await prisma.verificationToken.update({
      where: { identifier_token: { identifier: record.identifier, token: record.token } },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, reason: "invalid" };
  }

  // Single use.
  await prisma.verificationToken.deleteMany({ where: { identifier: normalized } });
  return { ok: true };
}
