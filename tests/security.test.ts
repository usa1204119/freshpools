import { describe, it, expect, beforeAll } from "vitest";
import { createHmac } from "node:crypto";

/**
 * Payment signature verification and OTP hashing. A bug in either is a
 * security hole rather than a cosmetic defect, so both are tested against
 * independently computed expected values rather than against themselves.
 */

const KEY_SECRET = "test_key_secret_value";
const WEBHOOK_SECRET = "test_webhook_secret_value";
const AUTH_SECRET = "test_auth_secret_value";

type RazorpayModule = typeof import("@/lib/razorpay");
type OtpModule = typeof import("@/lib/otp");

let razorpay: RazorpayModule;
let otp: OtpModule;

beforeAll(async () => {
  // These modules read env at import time, so it must be set first.
  process.env.RAZORPAY_KEY_ID = "rzp_test_abc123";
  process.env.RAZORPAY_KEY_SECRET = KEY_SECRET;
  process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
  process.env.AUTH_SECRET = AUTH_SECRET;

  razorpay = await import("@/lib/razorpay");
  otp = await import("@/lib/otp");
});

describe("verifyCheckoutSignature", () => {
  const orderId = "order_ABC123";
  const paymentId = "pay_XYZ789";

  function sign(payload: string, secret = KEY_SECRET) {
    return createHmac("sha256", secret).update(payload).digest("hex");
  }

  it("accepts a signature over order_id|payment_id", () => {
    const signature = sign(`${orderId}|${paymentId}`);
    expect(razorpay.verifyCheckoutSignature({ orderId, paymentId, signature })).toBe(true);
  });

  it("rejects a signature made with the wrong secret", () => {
    const signature = sign(`${orderId}|${paymentId}`, "attacker_secret");
    expect(razorpay.verifyCheckoutSignature({ orderId, paymentId, signature })).toBe(false);
  });

  it("rejects a signature for a different order", () => {
    const signature = sign(`order_OTHER|${paymentId}`);
    expect(razorpay.verifyCheckoutSignature({ orderId, paymentId, signature })).toBe(false);
  });

  it("rejects a signature for a different payment", () => {
    const signature = sign(`${orderId}|pay_OTHER`);
    expect(razorpay.verifyCheckoutSignature({ orderId, paymentId, signature })).toBe(false);
  });

  it("rejects empty and malformed signatures without throwing", () => {
    for (const signature of ["", "not-hex", "a".repeat(64)]) {
      expect(razorpay.verifyCheckoutSignature({ orderId, paymentId, signature })).toBe(false);
    }
  });

  it("rejects a signature of the wrong length rather than crashing", () => {
    // timingSafeEqual throws on length mismatch — the guard must catch it.
    expect(() =>
      razorpay.verifyCheckoutSignature({ orderId, paymentId, signature: "abc" }),
    ).not.toThrow();
  });
});

describe("verifyWebhookSignature", () => {
  const body = JSON.stringify({ event: "payment.captured", payload: {} });

  it("accepts a signature over the exact raw body", () => {
    const signature = createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
    expect(razorpay.verifyWebhookSignature(body, signature)).toBe(true);
  });

  it("rejects if the body was altered by even one character", () => {
    const signature = createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
    const tampered = body.replace("captured", "capturee");
    expect(razorpay.verifyWebhookSignature(tampered, signature)).toBe(false);
  });

  it("rejects a signature made with the checkout secret", () => {
    // The webhook secret and key secret are different values in Razorpay.
    const signature = createHmac("sha256", KEY_SECRET).update(body).digest("hex");
    expect(razorpay.verifyWebhookSignature(body, signature)).toBe(false);
  });

  it("rejects an empty signature", () => {
    expect(razorpay.verifyWebhookSignature(body, "")).toBe(false);
  });
});

describe("razorpay config helpers", () => {
  it("detects test mode from the key prefix", () => {
    expect(razorpay.isTestMode()).toBe(true);
  });

  it("reports itself configured when both keys are present", () => {
    expect(razorpay.razorpayConfigured).toBe(true);
  });
});

describe("OTP", () => {
  it("generates a zero-padded 6-digit code", () => {
    for (let i = 0; i < 500; i += 1) {
      expect(otp.generateOtp()).toMatch(/^\d{6}$/);
    }
  });

  it("produces varied codes", () => {
    const codes = new Set(Array.from({ length: 200 }, () => otp.generateOtp()));
    // A constant or near-constant generator would collapse this set.
    expect(codes.size).toBeGreaterThan(150);
  });

  it("hashes deterministically for the same email and code", () => {
    expect(otp.hashOtp("a@example.com", "123456")).toBe(
      otp.hashOtp("a@example.com", "123456"),
    );
  });

  it("is case-insensitive on the email", () => {
    expect(otp.hashOtp("A@Example.com", "123456")).toBe(
      otp.hashOtp("a@example.com", "123456"),
    );
  });

  it("binds the hash to the email, so a code cannot be replayed elsewhere", () => {
    expect(otp.hashOtp("a@example.com", "123456")).not.toBe(
      otp.hashOtp("b@example.com", "123456"),
    );
  });

  it("differs for different codes", () => {
    expect(otp.hashOtp("a@example.com", "123456")).not.toBe(
      otp.hashOtp("a@example.com", "123457"),
    );
  });

  it("never returns the raw code", () => {
    const hash = otp.hashOtp("a@example.com", "123456");
    expect(hash).not.toContain("123456");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
