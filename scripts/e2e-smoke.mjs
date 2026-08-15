/**
 * End-to-end smoke test against a running dev server.
 *
 * Exercises the paths that unit tests cannot reach: OTP sign-in, the admin
 * event form, and candidate registration. Reads the one-time code out of the
 * dev-server log, which is where it is printed when RESEND_API_KEY is unset.
 *
 *   node scripts/e2e-smoke.mjs
 */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const BASE = process.env.SMOKE_BASE ?? "http://localhost:3000";
const LOG = process.env.SMOKE_LOG;
const OUT = process.env.SMOKE_OUT ?? "shots";

const results = [];
let browser;

function record(step, ok, detail = "") {
  results.push({ step, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${step}${detail ? ` — ${detail}` : ""}`);
}

/** The most recent OTP printed for this address, or null. */
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

  // The code field only appears once the request step succeeds.
  await page.waitForSelector("#code", { timeout: 30_000 });

  // Give the server a moment to flush the log line.
  let code = null;
  for (let i = 0; i < 30 && !code; i += 1) {
    await page.waitForTimeout(500);
    code = latestOtp(email);
  }
  if (!code) throw new Error(`no OTP found in log for ${email}`);

  await page.fill("#code", code);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 30_000,
  });
  return code;
}

try {
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();

  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(String(error)));

  /* ── 1. Admin sign-in ─────────────────────────────────────────────────── */
  try {
    await signIn(page, "admin@freshpools.in");
    // Sign-in lands on /onboarding, which routes by role. Follow that hop.
    await page
      .waitForURL((url) => url.pathname.startsWith("/admin"), { timeout: 45_000 })
      .catch(() => undefined);
    const onAdmin = page.url().includes("/admin");
    record("admin OTP sign-in", onAdmin, page.url());
  } catch (error) {
    record("admin OTP sign-in", false, String(error).split("\n")[0]);
    throw error;
  }

  /* ── 2. Admin overview renders ────────────────────────────────────────── */
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  record("admin overview renders", await page.locator("h1").first().isVisible());
  await page.screenshot({ path: `${OUT}/e2e-admin.png` });

  /* ── 3. Create an event ───────────────────────────────────────────────── */
  const slug = `smoke-event-${Date.now().toString(36)}`;
  await page.goto(`${BASE}/admin/events/new`, { waitUntil: "networkidle" });

  await page.fill("#title", "Smoke Test Sprint");
  await page.fill("#slug", slug);
  await page.fill("#tagline", "Created by the end-to-end smoke test.");
  await page.fill(
    "#problemStatement",
    "Build a tool that reconciles two delivery manifests and reports the differences. " +
      "It must handle a malformed row without crashing, and explain each difference in plain language. " +
      "This text exists to clear the minimum length the schema enforces.",
  );
  await page.selectOption("#mode", "ONLINE");
  await page.fill("#deadline", "2027-03-10T23:59");
  await page.fill("#startAt", "2027-03-12T09:00");
  await page.fill("#endAt", "2027-03-14T18:00");
  await page.fill("#registrationFee", "200");
  await page.fill("#depositAmount", "100");
  await page.selectOption("#status", "REGISTRATION_OPEN");

  await page.click('button[type="submit"]:has-text("Create event")');

  // Wait on the outcome, not a timer: these actions cross the Atlantic to a
  // us-east-2 database, so a fixed sleep tests the network, not the code.
  let createdOk = false;
  try {
    // NOTE: must exclude "/new" — it matches a naive /admin/events/[^/]+$ and
    // makes this assertion trivially true even when the redirect never fires.
    await page.waitForURL(
      (url) =>
        /^\/admin\/events\/[^/]+$/.test(url.pathname) &&
        !url.pathname.endsWith("/new"),
      { timeout: 60_000 },
    );
    createdOk = true;
  } catch {
    createdOk = false;
  }
  record("create event via admin form", createdOk, page.url());
  await page.screenshot({ path: `${OUT}/e2e-event-created.png` });

  /* ── 4. Business rules reject a bad event ─────────────────────────────── */
  await page.goto(`${BASE}/admin/events/new`, { waitUntil: "networkidle" });
  await page.fill("#title", "Bad Dates");
  await page.fill("#problemStatement", "x".repeat(120));
  await page.selectOption("#mode", "ONLINE");
  // Deadline AFTER kickoff — must be refused.
  await page.fill("#deadline", "2027-03-20T23:59");
  await page.fill("#startAt", "2027-03-12T09:00");
  await page.fill("#endAt", "2027-03-14T18:00");
  await page.fill("#registrationFee", "200");
  await page.fill("#depositAmount", "500"); // deposit > fee, also invalid
  await page.click('button[type="submit"]:has-text("Create event")');
  await page.waitForTimeout(2500);
  const stillOnForm = page.url().includes("/admin/events/new");
  record("invalid event rejected server-side", stillOnForm, page.url());

  /* ── 5. Public event page is live ─────────────────────────────────────── */
  const publicResponse = await page.goto(`${BASE}/hackathons/${slug}`, {
    waitUntil: "networkidle",
  });
  record("new event has a public page", publicResponse?.status() === 200, `status ${publicResponse?.status()}`);
  await page.screenshot({ path: `${OUT}/e2e-event-public.png` });

  /* ── 6. Candidate registration ────────────────────────────────────────── */
  await context.clearCookies();
  const candidatePage = await context.newPage();
  candidatePage.on("pageerror", (error) => pageErrors.push(String(error)));

  await signIn(candidatePage, "asha@example.com");
  record("candidate OTP sign-in", candidatePage.url().includes("/me") || candidatePage.url().includes("/onboarding"), candidatePage.url());

  await candidatePage.goto(`${BASE}/hackathons/${slug}/register`, {
    waitUntil: "networkidle",
  });
  const hasForm = await candidatePage.locator("#college").isVisible().catch(() => false);
  record("registration form reachable", hasForm, candidatePage.url());

  if (hasForm) {
    await candidatePage.fill("#phone", "9876543210");
    await candidatePage.click('button[type="submit"]:has-text("Save and continue")');

    let reachedTeamStep = false;
    try {
      await candidatePage.waitForSelector("#teamName", { timeout: 60_000 });
      reachedTeamStep = true;
    } catch {
      reachedTeamStep = false;
    }
    record("registration saved, reached team step", reachedTeamStep, candidatePage.url());
    await candidatePage.screenshot({ path: `${OUT}/e2e-register.png` });

    if (reachedTeamStep) {
      await candidatePage.fill("#teamName", "Smoke Squad");
      await candidatePage.click('button[type="submit"]:has-text("Create team")');
      let joinCodeVisible = false;
      try {
        await candidatePage.waitForSelector("text=Join code", { timeout: 60_000 });
        joinCodeVisible = true;
      } catch {
        joinCodeVisible = false;
      }
      record("team created with join code", joinCodeVisible);
      await candidatePage.screenshot({ path: `${OUT}/e2e-team.png` });
    }
  }

  /* ── 6b. Payment: the amount must come from the server ────────────────── */
  const payButton = candidatePage.locator('button:has-text("Pay ·")').first();
  if (await payButton.isVisible().catch(() => false)) {
    let orderBody = null;
    let orderRequestBody = null;
    try {
      const [response] = await Promise.all([
        candidatePage.waitForResponse(
          (r) => r.url().includes("/api/payments/order") && r.request().method() === "POST",
          { timeout: 60_000 },
        ),
        payButton.click(),
      ]);
      orderRequestBody = response.request().postData();
      orderBody = await response.json();
    } catch (error) {
      record("payment order created", false, String(error).split("\n")[0]);
    }

    if (orderBody) {
      record(
        "payment order created",
        Boolean(orderBody.orderId),
        `${orderBody.orderId} · ${orderBody.amount} paise`,
      );
      record(
        "order amount matches the event fee (20000 paise)",
        orderBody.amount === 20000,
        `got ${orderBody.amount}`,
      );
      // The client sends only a registrationId — never a price.
      record(
        "client request carries no amount field",
        Boolean(orderRequestBody) && !/amount/i.test(orderRequestBody),
        orderRequestBody ?? "",
      );

      /* NON-NEGOTIABLE #19: a crafted request must not be able to set its own
         price. Re-post the same registration with a ₹1 amount and confirm the
         server still charges the event's fee. */
      const registrationId = JSON.parse(orderRequestBody ?? "{}").registrationId;
      const tampered = await candidatePage.evaluate(async (id) => {
        const res = await fetch("/api/payments/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registrationId: id, amount: 100, registrationFee: 100 }),
        });
        return { status: res.status, body: await res.json().catch(() => null) };
      }, registrationId);

      const ignoredTamper =
        tampered.status === 409 || // already has a live order
        (tampered.status === 200 && tampered.body?.amount === 20000);
      record(
        "server ignores a client-supplied amount",
        ignoredTamper,
        `status ${tampered.status}, amount ${tampered.body?.amount ?? "n/a"}`,
      );
    }
  } else {
    record("payment step reached", false, "pay button not visible");
  }

  /* ── 7. Candidate dashboard ───────────────────────────────────────────── */
  await candidatePage.goto(`${BASE}/me/hackathons`, { waitUntil: "networkidle" });
  const listsEvent = await candidatePage
    .locator("text=Smoke Test Sprint")
    .first()
    .isVisible()
    .catch(() => false);
  record("event appears on candidate dashboard", listsEvent);
  await candidatePage.screenshot({ path: `${OUT}/e2e-me.png` });

  record("no uncaught client errors", pageErrors.length === 0, pageErrors.slice(0, 3).join(" | "));
} catch (error) {
  console.error("\nAborted:", String(error).split("\n")[0]);
} finally {
  if (browser) await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log("Failures:");
    for (const f of failed) console.log(`  - ${f.step}: ${f.detail}`);
    process.exitCode = 1;
  }
}
