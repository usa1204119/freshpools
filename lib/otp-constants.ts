/**
 * Split out of `lib/otp.ts` because that module is `server-only` (it touches
 * node:crypto and Prisma). Client components need the shape of an OTP without
 * pulling in any of that.
 */
export const OTP_LENGTH = 6;
export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
