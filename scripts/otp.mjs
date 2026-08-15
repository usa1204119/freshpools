/**
 * Pulls the most recent sign-in code for an address out of the deployment logs.
 *
 *   npm run otp asha@example.com
 *   npm run otp admin@freshpools.in -- --local
 *
 * This exists only because RESEND_API_KEY is unset, so codes are logged instead
 * of emailed. It is a stopgap for testing, NOT a way to run the product: it
 * requires Vercel account access, so only the project owner can use it. Once
 * email works, delete this.
 */
import { execFileSync, spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

const args = process.argv.slice(2);
const email = args.find((a) => !a.startsWith("-"))?.toLowerCase();
const useLocal = args.includes("--local");

if (!email) {
  console.error("usage: npm run otp <email> [-- --local]");
  process.exit(1);
}

const PATTERN = /\[auth\] OTP for (\S+): (\d{6})/g;

function latestFrom(text) {
  const hits = [...text.matchAll(PATTERN)].filter(
    ([, addr]) => addr.toLowerCase() === email,
  );
  return hits.length ? hits[hits.length - 1][2] : null;
}

/* ── Local dev server log ─────────────────────────────────────────────────── */
if (useLocal) {
  const candidates = [
    process.env.DEV_LOG,
    ".next/dev.log",
    "dev.log",
  ].filter(Boolean);

  const found = candidates.find((p) => existsSync(p));
  if (!found) {
    console.error(
      "No local log found. Start the dev server writing to one:\n" +
        "  npm run dev > dev.log 2>&1",
    );
    process.exit(1);
  }
  const code = latestFrom(readFileSync(found, "utf8"));
  console.log(code ? `\n  ${code}\n` : `No code found for ${email} in ${found}`);
  process.exit(code ? 0 : 1);
}

/* ── Deployment logs ──────────────────────────────────────────────────────── */
const target = process.env.OTP_TARGET ?? "https://freshpools.vercel.app";
const vercel = process.platform === "win32" ? "vercel.cmd" : "vercel";

console.log(`reading logs for ${email}…`);

// `vercel logs` streams, so collect for a few seconds and then stop.
const child = spawn(vercel, ["logs", target, "--json"], {
  shell: process.platform === "win32",
  stdio: ["ignore", "pipe", "ignore"],
});

let buffer = "";
child.stdout.on("data", (chunk) => {
  buffer += chunk.toString();
});

const WINDOW_MS = Number(process.env.OTP_WINDOW_MS ?? 18_000);
setTimeout(() => {
  child.kill();
  const code = latestFrom(buffer);
  if (code) {
    console.log(`\n  ${code}\n`);
  } else {
    console.log(
      `\nNo code found for ${email}.\n` +
        "Request one first (the login page must have been submitted), then re-run.\n" +
        "Logs can lag a few seconds.",
    );
    process.exitCode = 1;
  }
}, WINDOW_MS);
