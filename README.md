# FreshPools

> Verified fresher talent, proven through competitive nature.

FreshPools runs competitive coding events, verifies what participants actually
built, and sends hiring companies a shortlist instead of a resume pile.

---

## Quick start

```bash
npm install
npx prisma generate
npm run dev            # http://localhost:3000
```

The marketing site runs **without a database**. Sections that depend on real
data (verified-candidate count, hiring-partner marquee, sample profiles) hide
themselves rather than render a zero or a placeholder — see
[NON-NEGOTIABLES](#non-negotiables) #12.

To run the full app (auth, registration, payments, admin):

```bash
cp .env.example .env.local     # fill in DATABASE_URL and AUTH_SECRET
npm run db:push
npm run db:seed
npm run dev
```

`npm run db:seed` prints the seeded sign-in addresses. With `RESEND_API_KEY`
unset, OTP codes are written to the **server log** instead of being emailed.

---

## Environment

| Variable | Required for | Notes |
|---|---|---|
| `DATABASE_URL` | everything but marketing | Postgres / Neon |
| `AUTH_SECRET` | auth | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | emails, sitemap | e.g. `https://freshpools.in` |
| `RESEND_API_KEY`, `EMAIL_FROM`, `NOTIFY_EMAIL` | email | without it, sends are logged and skipped |
| `RAZORPAY_KEY_ID` / `_SECRET` / `_WEBHOOK_SECRET` | payments | use `rzp_test_*` until verified end to end |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | checkout | public key only |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | rate limiting | **see the warning below** |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | analytics | optional |

> ⚠️ **Rate limiting falls back to an in-memory limiter when Upstash is
> unconfigured.** That fallback is per-instance and therefore ineffective on
> serverless. Configure Upstash before going live, or OTP and payment endpoints
> are effectively unthrottled across instances.

---

## Stack

Next.js 15 (App Router) · TypeScript strict · Tailwind CSS v4 · Prisma +
Postgres · Auth.js v5 (email OTP) · Razorpay · Resend · Framer Motion.

```
app/
  (marketing)/   landing, hackathons, for-companies, for-colleges, about
  (auth)/        login, signup, onboarding
  (candidate)/me/  dashboard, profile, hackathons, team, submission, opportunities
  (company)/co/    dashboard, requirements, talent, shortlist, pipeline
  (admin)/admin/   events, registrations, submissions, scoring, talent,
                   requirements, matching, intros, colleges, companies
  api/           auth, payments/order, webhooks/razorpay
components/
  ui/            primitives, restyled to radius 0
  marketing/     Hero, MixedHeadline, FeeDisplay, LogoMarquee, FAQ, …
  forms/         client forms bound to server actions
  app/           shared dashboard chrome
lib/
  db · auth · otp · email · razorpay · rate-limit · queries · talent
  actions/       server actions (leads, auth, profile, registration,
                 submission, company, intro, admin)
  validations/   Zod schemas — the same schema runs on the server
```

---

## Design system

Editorial, print-inspired: flat colour blocks, 1px ink borders, and **zero
border radius anywhere**.

Rather than rely on discipline, `app/globals.css` deletes the offending Tailwind
namespaces outright:

```css
--radius-*: initial;        /* every rounded-* utility ceases to exist */
--shadow-*: initial;
--drop-shadow-*: initial;
--blur-*: initial;
```

A stray `rounded-lg` cannot reintroduce a radius, because the class is not in
the build. Verified in the compiled CSS: the only `border-radius` declarations
are `:0`, and no gradient or shadow is emitted.

**Type.** `MixedHeadline` is the signature component — write the copy as one
string and wrap the emphasis in asterisks:

```tsx
<MixedHeadline text="Hire freshers who have **already built** something." />
// serif · heavy sans · serif
```

**Motion.** Exactly three: hero stagger on load, a 20px section fade-up on first
intersection, and a 4px arrow translate on button hover. All are disabled under
`prefers-reduced-motion`.

---

## Money

All amounts are stored in **paise** (Razorpay's unit) except `Requirement.ctcMin`
/ `ctcMax` and `Intro.feeAmount`, which are rupees per annum. Never mix the two —
use `formatPaise()` and `formatLpa()` from `lib/utils.ts`.

### Payment flow

```
Register → details → team → payment → confirmation
                              │
                    isSponsoredFree? ─ yes → status WAIVED, no charge
                                     └ no  → Razorpay order → checkout → webhook
```

- Orders are created **server-side only**, and the amount is read from the
  `Event` row. The request body carries only a `registrationId`; the client has
  no say in what it is charged.
- `POST /api/webhooks/razorpay` is the **single source of truth**. The browser
  callback only triggers a refresh. Close the tab mid-payment and the webhook
  still lands; the next page load shows the right state.
- Webhook handlers are idempotent — Razorpay retries, and a retry must not
  double-send a receipt or move a paid registration backwards.
- Payment failure leaves the registration `PENDING` with a retry button.
- Refunds are **never automatic**: an admin verifies check-in, then runs
  "Refund deposits for checked-in" on the event's registrations page.
- If an event becomes sponsored-free *after* people have paid, "Refund everyone
  in full" issues full refunds and marks them waived.

### Verifying payments

```bash
npm run check:razorpay   # creates a real test-mode order, checks the amount
npm run smoke            # full flow, incl. the client-cannot-set-price check
```

`check:razorpay` runs under `tsx --conditions=react-server`. Without that flag
the `server-only` import throws, because Node otherwise resolves it to the copy
that deliberately fails outside a server component.

**Verified against the live test API:** credentials work, an order round-trips
₹200 exactly, valid signatures are accepted and forged ones rejected, and zero /
negative / fractional amounts are refused. The smoke test additionally posts a
crafted `amount: 100` to `/api/payments/order` and confirms the server still
charges 20000 paise — NON-NEGOTIABLE #19, tested rather than asserted.

**Not yet verified:** capture, failure and refund handling all arrive by
webhook, so they need a tunnel:

```bash
npx localtunnel --port 3000
```

Point the Razorpay dashboard at `https://<tunnel>/api/webhooks/razorpay`,
subscribe to `payment.captured`, `payment.failed`, `refund.processed` and
`refund.failed`, then set `RAZORPAY_WEBHOOK_SECRET`. Until that exists a
successful payment stays `PENDING`, which is correct: the webhook is the only
source of truth.

---

## NON-NEGOTIABLES

These are enforced in code, not just documented. Each is commented at its
enforcement point.

**Product**

1. **A company never sees a candidate's email or phone.** Enforced structurally
   in `lib/talent.ts` — the Prisma `select` simply omits those columns, so no
   downstream mistake can leak them. Companies can *request* an introduction
   (`IntroRequest`); only an admin can create an `Intro`, after asking the
   candidate.
2. Demo video is mandatory on submissions and leads the company-facing profile.
3. **Scoring is per candidate, never per team** — `Score` is unique on
   `(submissionId, candidateId)`.
4. Every intro is logged. `IntroEvent` is an append-only audit trail written on
   every status transition, for dispute proof.
5. **No paid tier, no priority-for-payment, no candidate subscription.** The
   registration fee is logistics only, and `StudentsNeverPayNote` states this on
   every page that mentions money to a student.
6. Deposit refunds require a human: admin verifies check-in, then triggers.

**Design**

7. Border radius zero everywhere · 8. no shadow/gradient/glow — both enforced by
deleting the Tailwind namespaces. 9. Every major headline is mixed serif + sans.
10. Numbered markers only where content is a real sequence (the four
verification steps, the timeline). 11. Borders are always 1px solid ink.
12. **Numbers and logos render only when real** — zero verified candidates hides
the hero line; zero partners hides the marquee entirely.

**Quality floor**

13. Mobile-first, down to 360px · 14. 2px ink focus rings on `:focus-visible` ·
15. `prefers-reduced-motion` respected globally · 16. coral/yellow blocks always
carry ink text · 17. every form is Zod-validated on the server with the same
schema · 18. OTP and payment endpoints rate-limited · 19. payment amounts always
come from the server.

---

## Scripts

```bash
npm run dev          npm run build         npm start
npm run typecheck    npm run lint
npm run test         npm run test:watch
npm run check        # typecheck + tests + build, in one go
npm run db:push      npm run db:migrate    npm run db:seed
npm run db:studio    npm run db:generate
```

## Tests

98 tests (`npm run test`), concentrated where a silent bug is expensive:

| File | Covers |
|---|---|
| `tests/utils.test.ts` | Money formatting (paise↔rupees, lakh grouping), **name masking** — the privacy guarantee — IST date handling |
| `tests/validations.test.ts` | Every schema's business rules: deposit ≤ fee, deadline ≤ kickoff, CTC range order, per-criterion score maxima, and that `registrationSchema` has **no amount field** |
| `tests/security.test.ts` | Razorpay checkout + webhook signature verification against independently computed HMACs, incl. tampered bodies and wrong-secret rejection; OTP hashing bound to email |
| `tests/video-datetime.test.ts` | Demo-video URL parsing (incl. rejecting `javascript:`), IST datetime round-trip across month/year boundaries |

The suite found a real bug on its first run: `formatDateRange` compared **UTC**
months while rendering **IST** days, so an event spanning a month boundary in
UTC but not IST rendered in the long cross-month form. Fixed in
`lib/utils.ts:istMonthKey`.

## Deploying

`vercel.json` pins the region to **`sin1` (Singapore)**, and the Neon database
should be in **AWS Asia Pacific 1 (Singapore)** too. Neon has no Mumbai region,
so Singapore is the closest option to India.

The app is deliberately co-located with the database rather than moved closer to
users in `bom1`. Server actions here issue several *sequential* queries, so
app↔database latency is multiplied while user↔app latency is paid once. Putting
both in Singapore costs a user in India roughly 40ms on the request and saves
40ms on every query behind it. If the workload ever becomes read-light and
chatty in the other direction, revisit this.

`vercel.json` also sets `nosniff`, `DENY` framing, a strict referrer policy, and
`no-store` on webhooks.

`build` runs `prisma generate && next build`. That is not cosmetic: Vercel
restores a cached `node_modules` and skips postinstall, so without the explicit
generate the build fails with a stale or missing Prisma client.

---

## Before you launch

- [ ] Set `DATABASE_URL`, `AUTH_SECRET`, and a real `NEXT_PUBLIC_APP_URL`
- [ ] **Configure Upstash** — the in-memory rate-limit fallback is not
      serverless-safe
- [ ] Verify the Razorpay flow in test mode, including a failed payment, a
      closed-tab payment, and a deposit refund
- [ ] Register the webhook URL and set `RAZORPAY_WEBHOOK_SECRET`
- [ ] Promote your admin user: `UPDATE "User" SET role='ADMIN' WHERE email=…`
- [ ] Only mark a company a hiring partner when it genuinely is — that flag
      publishes its name in the public marquee

### Still missing

Everything below is blocked on a credential or a live service, not on code:

- **Nothing DB-dependent has ever executed.** `prisma db push` has not run; the
  seed has never run. Every `/me`, `/co`, `/admin` page compiles and typechecks
  but has never rendered a real row.
- **Live payment testing.** Every Razorpay path is written, typechecked and
  unit-tested at the signature level, but no transaction has run against the API.
- **Email delivery.** Six templates exist; none has been sent.
- **No end-to-end tests.** The 98 tests cover pure logic. Server actions,
  Prisma queries and React components have no automated coverage — verification
  there has been typecheck + build + manual HTTP checks.

## Running an event, end to end

1. `/admin/events/new` — save as a draft
2. Add prizes on the edit page
3. Set status to **Announced** (page goes live) then **Registration open**
4. Students register and pay; the webhook confirms
5. On the day: `/admin/events/[id]/registrations`, filter by name, check people in
6. Run **Refund deposits for checked-in**
7. Teams submit; score each person in `/admin/scoring` and assign tiers
8. Toggle "onboard to talent pool" to make a profile visible to companies
9. Match against a requirement in `/admin/matching/[reqId]` and send intros
10. Track the 90-day clock in `/admin/intros`
