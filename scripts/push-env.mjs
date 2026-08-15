/**
 * Copies the environment variables Vercel needs from .env.local.
 *
 *   node scripts/push-env.mjs [production|preview|development]
 *
 * Only the keys listed below are sent — .env.local also holds local-only noise
 * (Vercel's own OIDC token, empty placeholders) that must not be uploaded.
 * Existing values are removed first so re-running is idempotent.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const target = process.argv[2] ?? "production";

const KEYS = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "NEXT_PUBLIC_RAZORPAY_KEY_ID",
  "RAZORPAY_WEBHOOK_SECRET",
  "EMAIL_FROM",
  "NOTIFY_EMAIL",
  "RESEND_API_KEY",
  "UPLOADTHING_TOKEN",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "NEXT_PUBLIC_APP_URL",
  "AUTH_URL",
  "NEXT_PUBLIC_PLAUSIBLE_DOMAIN",
];

function parseEnv(file) {
  const out = {};
  for (const rawLine of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    // Strip surrounding quotes, which Vercel would otherwise store literally.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const env = parseEnv(".env.local");
const vercel = process.platform === "win32" ? "vercel.cmd" : "vercel";

// Node refuses to spawn a .cmd without a shell on Windows. Only fixed
// identifiers are ever passed as arguments; the secret itself goes over stdin,
// so it never appears in a command line or process list.
const spawnOpts = { shell: process.platform === "win32" };

let pushed = 0;
let skipped = 0;

for (const key of KEYS) {
  const value = env[key];
  if (!value) {
    console.log(`skip   ${key} (empty locally)`);
    skipped += 1;
    continue;
  }

  // Remove first so a re-run updates rather than erroring on a duplicate.
  try {
    execFileSync(vercel, ["env", "rm", key, target, "--yes"], {
      ...spawnOpts,
      stdio: "ignore",
    });
  } catch {
    // Not present yet — expected on the first run.
  }

  try {
    execFileSync(vercel, ["env", "add", key, target], {
      ...spawnOpts,
      input: value,
      stdio: ["pipe", "ignore", "ignore"],
    });
    console.log(`push   ${key}`);
    pushed += 1;
  } catch (error) {
    console.log(`FAIL   ${key} — ${error.message.split("\n")[0]}`);
  }
}

console.log(`\n${pushed} pushed, ${skipped} skipped (${target})`);
