/**
 * Screenshot helper for visual checks during development.
 *   node scripts/shoot.mjs /            desktop + mobile
 *   node scripts/shoot.mjs /hackathons 1440
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const target = process.argv[2] ?? "/";
const only = process.argv[3];
const base = process.env.SHOOT_BASE ?? "http://localhost:3000";
const outDir = process.env.SHOOT_OUT ?? "shots";

const viewports = only
  ? [{ name: only, width: Number(only), height: 900 }]
  : [
      { name: "desktop", width: 1366, height: 768 },
      { name: "mobile", width: 390, height: 844 },
    ];

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
for (const viewport of viewports) {
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
  });
  await page.goto(`${base}${target}`, { waitUntil: "networkidle", timeout: 90_000 });
  // Let the load-stagger animation settle before capturing.
  await page.waitForTimeout(1200);

  const slug = target === "/" ? "home" : target.replace(/\//g, "-").replace(/^-/, "");
  const file = `${outDir}/${slug}-${viewport.name}.png`;
  await page.screenshot({ path: file, fullPage: process.env.SHOOT_FULL === "1" });
  console.log(file);
  await page.close();
}
await browser.close();
