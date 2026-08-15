/**
 * Sends a real email through Resend to verify delivery works.
 *
 *   npx tsx --conditions=react-server scripts/check-email.ts you@example.com
 *
 * Until a domain is verified, Resend only accepts `onboarding@resend.dev` as a
 * sender and only delivers to the address the account was created with —
 * everything else is rejected. This script surfaces that error clearly rather
 * than letting it disappear into a server log.
 */
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const to = process.argv[2] ?? process.env.NOTIFY_EMAIL;

async function main() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set.");
  if (!to) throw new Error("No recipient. Pass one, or set NOTIFY_EMAIL.");

  console.log(`from: ${process.env.EMAIL_FROM}`);
  console.log(`to:   ${to}\n`);

  const { sendOtpEmail } = await import("../lib/email");

  // Uses the real template, so this also proves the HTML renders and the
  // Resend account accepts our sender.
  const sent = await sendOtpEmail(to, "123456", 10);

  if (sent) {
    console.log("Sent. Check the inbox (and spam) for a code of 123456.");
  } else {
    console.log(
      "Not sent — see the error above.\n\n" +
        "Most likely causes:\n" +
        "  · EMAIL_FROM uses a domain that is not verified in Resend\n" +
        "  · The recipient is not the address the Resend account was created\n" +
        "    with, and no domain is verified yet",
    );
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("FAILED:", error?.message ?? error);
  process.exit(1);
});
