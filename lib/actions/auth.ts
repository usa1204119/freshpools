"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { isDbConfigured } from "@/lib/db";
import { issueOtp, OTP_TTL_MINUTES } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import { otpRequestLimiter, otpVerifyLimiter } from "@/lib/rate-limit";
import {
  requestOtpSchema,
  verifyOtpSchema,
  zodToFieldErrors,
  type ActionState,
} from "@/lib/validations";

/**
 * `signIn` and `redirect` signal success by throwing a special error carrying a
 * NEXT_REDIRECT digest. Swallowing it would silently break the redirect, so it
 * has to be re-thrown. Checking the digest avoids importing a Next internal.
 */
function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

/** Only relative in-app paths may be used as a post-login redirect. */
function safeNext(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  if (!value.startsWith("/") || value.startsWith("//")) return undefined;
  return value;
}

export async function requestOtpAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = requestOtpSchema.safeParse({
    email: formData.get("email"),
    intendedRole: formData.get("intendedRole") ?? "CANDIDATE",
    name: formData.get("name") ?? undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the email address.",
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const { email } = parsed.data;

  const { success } = await otpRequestLimiter.limit(email);
  if (!success) {
    return {
      status: "error",
      message: "Too many codes requested. Wait ten minutes and try again.",
    };
  }

  if (!isDbConfigured) {
    return {
      status: "error",
      message:
        "Sign-in needs a database. Set DATABASE_URL and run `npm run db:push`.",
    };
  }

  try {
    const code = await issueOtp(email);
    const delivered = await sendOtpEmail(email, code, OTP_TTL_MINUTES);

    /**
     * Development only. Needed because an unverified Resend domain delivers
     * solely to the account owner's own address, so every other test account —
     * including the e2e smoke test's — would otherwise be unreachable.
     *
     * Deliberately NOT gated on "email failed": a live one-time code in a
     * production log is an impersonation vector for anyone with log access.
     * A misconfigured production logs the failure instead, below.
     */
    if (process.env.NODE_ENV !== "production") {
      console.info(`[auth] OTP for ${email}: ${code}`);
    } else if (!delivered) {
      console.error(
        `[auth] could not deliver a sign-in code to ${email} — check RESEND_API_KEY and that EMAIL_FROM uses a verified domain`,
      );
    }
  } catch (error) {
    console.error("[auth] failed to issue OTP", error);
    return { status: "error", message: "We couldn't send that code. Try again." };
  }

  return {
    status: "success",
    message: `Code sent to ${email}. It expires in ${OTP_TTL_MINUTES} minutes.`,
  };
}

export async function verifyOtpAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = verifyOtpSchema.safeParse({
    email: formData.get("email"),
    code: formData.get("code"),
    name: formData.get("name") ?? undefined,
    intendedRole: formData.get("intendedRole") ?? "CANDIDATE",
    next: formData.get("next") ?? undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Enter the 6-digit code from your email.",
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const { email, code, name, intendedRole, next } = parsed.data;

  const { success } = await otpVerifyLimiter.limit(email);
  if (!success) {
    return {
      status: "error",
      message: "Too many attempts. Request a fresh code in ten minutes.",
    };
  }

  try {
    await signIn("otp", {
      email,
      code,
      name,
      intendedRole,
      // Auth.js resolves the landing page; middleware bounces a wrong role to
      // that user's own dashboard, so this is safe as a default.
      redirectTo: safeNext(next) ?? "/onboarding",
    });
  } catch (error) {
    // signIn signals its redirect by throwing — that must bubble up.
    if (isRedirectError(error)) throw error;

    if (error instanceof AuthError) {
      return {
        status: "error",
        message: "That code is wrong or has expired. Request a new one.",
      };
    }

    console.error("[auth] sign-in failed", error);
    return { status: "error", message: "Sign-in failed. Try again." };
  }

  return { status: "success" };
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
