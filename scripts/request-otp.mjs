/**
 * Submits the login form for an address so a fresh code is issued.
 * Companion to scripts/otp.mjs when testing the deployed site.
 *
 *   node scripts/request-otp.mjs asha@example.com [baseUrl]
 */
import { chromium } from "playwright";

const email = process.argv[2];
const base = process.argv[3] ?? "https://freshpools.vercel.app";

if (!email) {
  console.error("usage: node scripts/request-otp.mjs <email> [baseUrl]");
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  await page.goto(`${base}/login`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.fill("#email", email);
  await page.click('button[type="submit"]');
  // The code field only appears once the request succeeded.
  await page.waitForSelector("#code", { timeout: 60_000 });
  console.log(`code requested for ${email} on ${base}`);
} catch (error) {
  console.error("failed:", String(error).split("\n")[0]);
  process.exitCode = 1;
} finally {
  await browser.close();
}
