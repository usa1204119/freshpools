/**
 * Screenshots the signed-in areas, which the public shoot script cannot reach.
 * Signs in per role via the OTP flow, reading codes from the dev-server log.
 *
 *   SHOOT_LOG=... SHOOT_OUT=... node scripts/shoot-app.mjs
 */
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";

const BASE = process.env.SHOOT_BASE ?? "http://localhost:3000";
const LOG = process.env.SHOOT_LOG;
const OUT = process.env.SHOOT_OUT ?? "shots";
const WIDTH = Number(process.env.SHOOT_WIDTH ?? 1366);

const ROLES = [
  {
    email: "admin@freshpools.in",
    label: "admin",
    paths: [
      "/admin",
      "/admin/events",
      "/admin/talent",
      "/admin/requirements",
      "/admin/intros",
      "/admin/colleges",
      "/admin/companies",
      "/admin/submissions",
      "/admin/scoring",
    ],
  },
  {
    email: "company@example.com",
    label: "co",
    paths: ["/co", "/co/requirements", "/co/talent", "/co/shortlist", "/co/pipeline"],
  },
  {
    email: "asha@example.com",
    label: "me",
    paths: ["/me", "/me/hackathons", "/me/profile", "/me/opportunities"],
  },
];

function latestOtp(email) {
  if (!LOG) return null;
  let text = "";
  try {
    text = readFileSync(LOG, "utf8");
  } catch {
    return null;
  }
  const matches = [...text.matchAll(/\[auth\] OTP for (\S+): (\d{6})/g)].filter(
    (m) => m[1] === email.toLowerCase(),
  );
  return matches.length ? matches[matches.length - 1][2] : null;
}

async function signIn(page, email) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", email);
  await page.click('button[type="submit"]');
  await page.waitForSelector("#code", { timeout: 60_000 });

  let code = null;
  for (let i = 0; i < 40 && !code; i += 1) {
    await page.waitForTimeout(500);
    code = latestOtp(email);
  }
  if (!code) throw new Error(`no OTP for ${email}`);

  await page.fill("#code", code);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 60_000 });
  await page.waitForTimeout(1500);
}

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const problems = [];

for (const role of ROLES) {
  const context = await browser.newContext({ viewport: { width: WIDTH, height: 900 } });
  const page = await context.newPage();
  page.on("pageerror", (error) => problems.push(`${role.label}: ${error}`));

  try {
    await signIn(page, role.email);
  } catch (error) {
    console.log(`SKIP ${role.label} — ${String(error).split("\n")[0]}`);
    await context.close();
    continue;
  }

  for (const path of role.paths) {
    try {
      const response = await page.goto(`${BASE}${path}`, {
        waitUntil: "networkidle",
        timeout: 90_000,
      });
      await page.waitForTimeout(800);
      const status = response?.status() ?? 0;
      const name = path.replace(/\//g, "-").replace(/^-/, "");
      await page.screenshot({ path: `${OUT}/app-${name}.png`, fullPage: true });
      console.log(`${status}  ${path}`);
      if (status >= 400) problems.push(`${path} returned ${status}`);
    } catch (error) {
      console.log(`ERR  ${path} — ${String(error).split("\n")[0]}`);
      problems.push(`${path}: ${String(error).split("\n")[0]}`);
    }
  }

  await context.close();
}

await browser.close();

if (problems.length) {
  console.log("\nProblems:");
  for (const problem of problems) console.log(`  - ${problem}`);
} else {
  console.log("\nNo errors.");
}
