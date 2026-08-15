import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import Razorpay from "razorpay";

/**
 * Payment rules baked into this module:
 *   · Orders are created server-side only. The amount ALWAYS comes from the
 *     Event row — never from the client (NON-NEGOTIABLE #19).
 *   · Payment is confirmed by the webhook. The client callback is treated as a
 *     hint to refresh, never as proof.
 *   · Refunds are issued through the API by an admin, never automatically.
 */

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

export const razorpayConfigured = Boolean(keyId && keySecret);

let client: Razorpay | null = null;

function getClient(): Razorpay {
  if (!razorpayConfigured) {
    throw new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    );
  }
  client ??= new Razorpay({ key_id: keyId!, key_secret: keySecret! });
  return client;
}

export function isTestMode(): boolean {
  return Boolean(keyId?.startsWith("rzp_test"));
}

export interface CreateOrderArgs {
  /** Paise. Read from the Event row by the caller — never from a request body. */
  amount: number;
  /** Our registration id, so the webhook can find the row again. */
  receipt: string;
  notes: Record<string, string>;
}

export async function createOrder({ amount, receipt, notes }: CreateOrderArgs) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`Refusing to create an order for a non-positive amount: ${amount}`);
  }

  return getClient().orders.create({
    amount,
    currency: "INR",
    receipt,
    notes,
    payment_capture: true,
  });
}

/**
 * Verifies the checkout callback signature: HMAC-SHA256(order_id|payment_id).
 * A valid signature still does not mark the registration paid — that only
 * happens on the webhook — but it lets us show an honest "processing" screen.
 */
export function verifyCheckoutSignature(args: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!keySecret) return false;
  const expected = createHmac("sha256", keySecret)
    .update(`${args.orderId}|${args.paymentId}`)
    .digest("hex");
  return safeCompare(expected, args.signature);
}

/** Verifies the `x-razorpay-signature` header against the raw request body. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[razorpay] RAZORPAY_WEBHOOK_SECRET is not set — rejecting webhook");
    return false;
  }
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeCompare(expected, signature);
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function fetchPayment(paymentId: string) {
  return getClient().payments.fetch(paymentId);
}

/**
 * Partial refund of the deposit portion. `speed: "normal"` because instant
 * refunds carry a fee and this is not time critical.
 */
export async function refundPayment(args: {
  paymentId: string;
  amount: number; // paise
  notes?: Record<string, string>;
}) {
  if (!Number.isInteger(args.amount) || args.amount <= 0) {
    throw new Error(`Refusing to refund a non-positive amount: ${args.amount}`);
  }

  return getClient().payments.refund(args.paymentId, {
    amount: args.amount,
    speed: "normal",
    notes: args.notes ?? {},
  });
}

export const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? keyId ?? "";
