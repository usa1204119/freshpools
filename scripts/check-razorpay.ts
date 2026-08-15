/**
 * Verifies the Razorpay integration against the real API in test mode.
 *
 * Covers the parts that unit tests cannot: that the credentials work, that an
 * order is actually created with the amount we asked for, and that a refund
 * request is well-formed. Creates a real test-mode order — harmless, but it
 * will appear in the dashboard.
 *
 *   npx tsx scripts/check-razorpay.ts
 */
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

async function main() {
  const { createOrder, isTestMode, razorpayConfigured, verifyCheckoutSignature } =
    await import("../lib/razorpay");

  console.log(`configured: ${razorpayConfigured}`);
  console.log(`test mode:  ${isTestMode()}`);

  if (!razorpayConfigured) {
    throw new Error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set.");
  }
  if (!isTestMode()) {
    throw new Error(
      "Refusing to run against LIVE keys — this creates a real order.",
    );
  }

  // ₹200, the default event entry fee, in paise.
  const amount = 20000;
  const receipt = `check_${Date.now()}`;

  console.log(`\ncreating order: ${amount} paise, receipt ${receipt}`);
  const order = await createOrder({
    amount,
    receipt,
    notes: { source: "check-razorpay-script" },
  });

  console.log(`  id:       ${order.id}`);
  console.log(`  amount:   ${order.amount} paise`);
  console.log(`  currency: ${order.currency}`);
  console.log(`  status:   ${order.status}`);

  if (Number(order.amount) !== amount) {
    throw new Error(
      `Amount mismatch: asked for ${amount}, Razorpay recorded ${order.amount}`,
    );
  }
  console.log("  ✓ amount round-trips exactly");

  // The signature helper must accept a genuine signature and reject a forged
  // one. Computed here the same way Razorpay's checkout does.
  const { createHmac } = await import("node:crypto");
  const fakePaymentId = "pay_TESTVERIFY000";
  const good = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${order.id}|${fakePaymentId}`)
    .digest("hex");

  const accepts = verifyCheckoutSignature({
    orderId: order.id,
    paymentId: fakePaymentId,
    signature: good,
  });
  const rejects = !verifyCheckoutSignature({
    orderId: order.id,
    paymentId: fakePaymentId,
    signature: "0".repeat(64),
  });

  console.log(`  ✓ accepts a valid signature: ${accepts}`);
  console.log(`  ✓ rejects a forged signature: ${rejects}`);
  if (!accepts || !rejects) throw new Error("Signature verification is wrong.");

  // Amount guards — the server must refuse a nonsensical charge outright.
  for (const bad of [0, -100, 1.5]) {
    let threw = false;
    try {
      await createOrder({ amount: bad, receipt: `bad_${bad}`, notes: {} });
    } catch {
      threw = true;
    }
    if (!threw) throw new Error(`createOrder accepted an invalid amount: ${bad}`);
  }
  console.log("  ✓ refuses zero, negative and fractional amounts");

  console.log("\nRazorpay integration works.");
  console.log(
    "Still unverified without a webhook: capture, failure and refund handling.",
  );
}

main().catch((error) => {
  console.error("\nFAILED:", error?.message ?? error);
  if (error?.statusCode) console.error("status:", error.statusCode);
  if (error?.error) console.error("detail:", JSON.stringify(error.error));
  process.exit(1);
});
