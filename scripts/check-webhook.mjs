/**
 * Verifies the deployed webhook endpoint agrees with our RAZORPAY_WEBHOOK_SECRET.
 *
 *   node scripts/check-webhook.mjs [baseUrl]
 *
 * Sends a correctly signed payload (must be accepted) and a forged one (must be
 * rejected). Uses an event id that matches no registration, so nothing in the
 * database is modified — this tests the signature gate, not the handlers.
 */
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

const base = process.argv[2] ?? "https://freshpools.vercel.app";

function readSecret() {
  const text = readFileSync(".env.local", "utf8");
  const line = text
    .split(/\r?\n/)
    .find((l) => l.startsWith("RAZORPAY_WEBHOOK_SECRET="));
  if (!line) throw new Error("RAZORPAY_WEBHOOK_SECRET missing from .env.local");
  return line.slice("RAZORPAY_WEBHOOK_SECRET=".length).trim().replace(/^["']|["']$/g, "");
}

const secret = readSecret();
const url = `${base}/api/webhooks/razorpay`;

// Deliberately references nothing real: no order id, no registration note.
const body = JSON.stringify({
  event: "payment.captured",
  payload: {
    payment: {
      entity: {
        id: "pay_SIGNATURE_CHECK_ONLY",
        order_id: "order_DOES_NOT_EXIST",
        amount: 20000,
        notes: {},
      },
    },
  },
});

async function post(signature, label) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-razorpay-signature": signature },
    body,
  });
  const text = await response.text();
  console.log(`  ${label}: ${response.status} ${text.slice(0, 80)}`);
  return response.status;
}

console.log(`webhook: ${url}`);
console.log(`secret:  ${secret.slice(0, 12)}… (${secret.length} chars)\n`);

const valid = createHmac("sha256", secret).update(body).digest("hex");
const forged = createHmac("sha256", "wrong-secret").update(body).digest("hex");

const okStatus = await post(valid, "correctly signed  ");
const badStatus = await post(forged, "forged signature  ");

console.log("");
const signatureAccepted = okStatus === 200;
const forgeryRejected = badStatus === 400;

console.log(`${signatureAccepted ? "PASS" : "FAIL"}  deployment accepts our signature`);
console.log(`${forgeryRejected ? "PASS" : "FAIL"}  deployment rejects a forgery`);

if (!signatureAccepted) {
  console.log(
    "\nThe secret in Vercel does not match the one in .env.local, or the deploy predates it.",
  );
}
process.exitCode = signatureAccepted && forgeryRejected ? 0 : 1;
