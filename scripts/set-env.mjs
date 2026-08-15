/**
 * Sets a single Vercel environment variable safely.
 *
 *   node scripts/set-env.mjs NEXT_PUBLIC_APP_URL https://example.com [production]
 *
 * Exists because piping a value into `vercel env add` from PowerShell prepends
 * a UTF-8 BOM (U+FEFF). That is invisible in the dashboard but makes the value
 * fail `new URL()` at build time with a bare "Invalid URL". Node's stdin write
 * has no such problem, and the value is stripped of any BOM defensively.
 */
import { execFileSync } from "node:child_process";

const [key, rawValue, target = "production"] = process.argv.slice(2);

if (!key || rawValue === undefined) {
  console.error("usage: node scripts/set-env.mjs KEY VALUE [target]");
  process.exit(1);
}

const value = rawValue.replace(/^﻿/, "").trim();
const vercel = process.platform === "win32" ? "vercel.cmd" : "vercel";
const opts = { shell: process.platform === "win32" };

try {
  execFileSync(vercel, ["env", "rm", key, target, "--yes"], {
    ...opts,
    stdio: "ignore",
  });
} catch {
  // Absent — fine.
}

execFileSync(vercel, ["env", "add", key, target], {
  ...opts,
  input: value,
  stdio: ["pipe", "ignore", "inherit"],
});

console.log(`${key} = ${JSON.stringify(value)}  (${target})`);
