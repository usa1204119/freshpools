# FreshPools.in — Complete Build Prompt (v2)

> Paste this into Claude Code / Cursor / v0, ya developer ko de do.
> Ye poora spec hai: brand, design system, tech stack, data model, page-by-page build order.
> **v2 changes:** paid registration + refundable deposit flow, payment gateway, sponsored-free event state, college workshop offering, "students never pay" trust element.

---

## PART A — BRIEF

Build **FreshPools** (freshpools.in) — a fresher-hiring platform for the Indian market.

**Positioning line:**
> *Verified fresher talent, proven through competitive nature.*

**Kya karta hai:**
FreshPools competitive coding events (hackathons + challenges) chalata hai, participants ka code aur skill verify karta hai, aur companies ko sirf verified candidates ka shortlist bhejta hai.

**Teen audiences, ek website:**
| Audience | Kya chahiye | Priority |
|---|---|---|
| Companies (paying customer) | verified freshers, screening time bachana | **Primary** |
| Colleges | placement numbers, industry connect, workshops | Secondary |
| Students | competitions, visibility, job intros | Tertiary |

**Landing page ka single job:** company se requirement form bharwana.

### Revenue model — ye product decisions drive karta hai

| Source | Kaun deta hai | Product mein kya chahiye |
|---|---|---|
| Placement fee | Company | Intro ledger, pipeline tracking, 90-day timer |
| Sponsorship | Company | Sponsor branding on event page, "entry free" state |
| College workshop | College | `/for-colleges` pe workshop offering + enquiry form |
| Registration fee (₹200) | Student | Payment gateway, deposit refund flow |

**Critical rule jo poore product mein reflect hona chahiye:**
Student kabhi bhi placement ya shortlist ke liye pay nahi karta. Registration fee sirf event logistics ke liye hai. Koi paid tier, koi priority-for-payment, koi subscription. Ye trust element site pe visible hona chahiye.

---

## PART B — DESIGN SYSTEM

Editorial/print-inspired. Sharp, high-contrast, flat color blocks. **Zero border radius anywhere** — ye poore design ka signature hai.

### Colors

```css
--paper:      #F2F0EB;   /* default page background — warm off-white */
--sky:        #E3EDFB;   /* hero + alternate section background */
--ink:        #111111;   /* text, borders, filled buttons */
--ink-muted:  #5C5A55;   /* body copy, secondary text */

/* Flat accent blocks — cards, stat tiles, feature panels */
--block-blue:   #BDD7F5;
--block-coral:  #F2B5A0;
--block-yellow: #FAE243;
--block-white:  #FFFFFF;
--block-ink:    #111111;   /* white text on this */

--line: #111111;   /* all borders — 1px solid, never gray */
```

**Rules:**
- Background hamesha `--paper` ya `--sky`. Kabhi white full-page nahi.
- Accent colors **sirf blocks/cards** mein — text ya button mein nahi.
- Ek section mein max 4 accent blocks, alternate karke.
- Borders hamesha 1px solid `--ink`. Koi gray border nahi, koi shadow nahi.
- **Gradients, shadows, glows, blur — bilkul nahi.** Sab flat.

### Typography

```css
--font-display: 'Instrument Serif', serif;        /* Google Fonts */
--font-sans:    'Satoshi', sans-serif;            /* Fontshare */
--font-mono:    'JetBrains Mono', monospace;      /* Google Fonts */
```

| Role | Face | Use |
|---|---|---|
| Display serif | Instrument Serif, 400 | Headline ka pehla half |
| Heavy sans | Satoshi, 700 | Headline ka emphasis word |
| Body | Satoshi, 400 | Paragraphs, UI |
| Utility mono | JetBrains Mono, 500, uppercase, `letter-spacing: 0.12em` | Eyebrows, labels, badges, prices, numbers |

**Signature move — mixed headline.** Har major headline mein serif aur bold sans mix:

```html
<h1>
  <span class="serif">Hire freshers who have</span>
  <span class="sans-bold">already built</span>
  <span class="serif">something.</span>
</h1>
```

**Type scale (desktop):**
```
h1  — 88px / 0.95 line-height / -0.02em tracking
h2  — 64px / 1.0
h3  — 36px / 1.1
body-lg — 20px / 1.5
body — 16px / 1.6
eyebrow (mono) — 11px / uppercase / 0.12em
label (mono) — 12px
```
Mobile: h1 → 44px, h2 → 34px.

### Components

**Button — primary**
```
background: --ink; color: white; padding: 16px 28px;
border-radius: 0; font: Satoshi 500 15px;
content: label + "→" arrow (12px gap)
hover: arrow 4px right translate. Bas. Koi color change nahi.
```

**Button — secondary**
```
background: transparent; color: --ink;
border: 1px solid --ink; same padding, same arrow
hover: background --ink, color white
```

**Feature card (color block)**
```
No radius. 1px --ink border. Padding 32px.
Top-left: bordered icon square (48x48, 1px border, no radius)
Top-right: mono index number (01, 02...) — SIRF tab jab content
           actually sequence ho. Warna number mat lagao.
Heading: Satoshi 700, 30px
Body: 15px, --ink-muted
Bottom: mono underlined link + arrow
Grid: 4 across desktop, 2 tablet, 1 mobile.
Colors cycle: blue → white → coral → yellow
```

**Price / fee display**  *(naya — registration fee, workshop pricing)*
```
Mono, uppercase, with the amount in Satoshi 700
Struck-through original + new value jab sponsored-free ho:
  ENTRY  ₹̶2̶0̶0̶  FREE
Sponsored state: yellow block strip, 1px ink border, mono text
```

**Eyebrow label**
```
Mono, 11px, uppercase, 0.12em tracking
Ek chhota 4-point sparkle glyph aage
e.g.  ✦ HOW VERIFICATION WORKS
```

**Section header pattern**
```
Left column (40%): eyebrow + big mixed headline + one-line sub
Right column (60%): the actual content
```

**Logo marquee**
```
Full-width strip, --paper background
Mono eyebrow centered above
Company names as TEXT (Satoshi 500, 18px), not images
Infinite horizontal scroll, 40s, pause on hover
Reduced-motion: static row
Empty state: render mat karo. Fake logos kabhi nahi.
```

**Accordion (FAQ)**
```
Two-column split: left = headline + contact, right = accordion
Rows separated by 1px --ink top border
Question: Satoshi 500 17px | Chevron right side, rotates on open
Answer: serif italic 16px, --ink-muted
```

**Dashboard mockup (hero ke neeche)**
```
Ek framed container, 1px border, no radius
Andar 3 stat tiles side by side:
  - yellow block: a % metric with a flat progress bar
  - white block: next event / date
  - black block (white text): target role / status
Static visual — real data nahi.
```

**Status badge (app pages)**
```
Flat color block + mono uppercase text, no radius, 1px ink border
yellow = pending | blue = active | coral = needs attention | black = done
```

### Motion

Sirf teen:
1. Hero: headline lines 60ms stagger fade-up on load
2. Sections: IntersectionObserver se 20px fade-up, once only
3. Buttons: arrow translate on hover

`prefers-reduced-motion: reduce` pe sab off. Koi parallax, scroll-jack, ya 3D nahi.

### Layout

```
Max width: 1280px, 32px gutters (mobile 20px)
Section padding: 120px vertical desktop, 64px mobile
Baseline grid: 8px
Breakpoints: 640 / 1024 / 1280
```

---

## PART C — TECH STACK

```
Framework      Next.js 15 (App Router) + TypeScript (strict)
Styling        Tailwind CSS v4 (design tokens as @theme vars)
Components     shadcn/ui — border-radius 0 kar ke restyle karo
Database       PostgreSQL on Neon (serverless)
ORM            Prisma
Auth           Auth.js v5 — email OTP, role in session
Payments       Razorpay (registration fee + deposit refunds)   ← naya
Email          Resend + React Email templates
File upload    UploadThing (resumes, photos)
Forms          React Hook Form + Zod
Admin tables   TanStack Table
Motion         Framer Motion (sirf upar wale 3 cases)
Hosting        Vercel
Analytics      Plausible ya Umami
Rate limiting  Upstash Redis (OTP + payment endpoints)
```

**Fonts:** Instrument Serif + JetBrains Mono → `next/font/google`. Satoshi → Fontshare CDN ya self-host via `next/font/local`.

**Razorpay notes:**
- Order create server-side only, amount server se aaye (client se kabhi nahi)
- Webhook se payment confirm karo, client callback pe bharosa mat karo
- Refund API se deposit wapas — admin trigger kare
- Test mode mein pura flow verify karo before live

**Folder structure:**
```
app/
  (marketing)/          page, hackathons, for-companies, for-colleges, about
  (auth)/               login, signup, onboarding
  (candidate)/me/       dashboard, profile, team, submission, opportunities
  (company)/co/         dashboard, requirements, talent, shortlist, pipeline
  (admin)/admin/        all admin routes
  api/
    auth/  payments/  webhooks/razorpay/  uploadthing/
components/
  ui/                   shadcn, restyled
  marketing/            Hero, FeatureGrid, LogoMarquee, FAQ, MixedHeadline, FeeDisplay
  app/                  shared dashboard components
lib/
  db.ts  auth.ts  email.ts  razorpay.ts  validations/
prisma/schema.prisma
```

**Middleware:** role-based route guard.
`/me/*` → candidate, `/co/*` → company, `/admin/*` → admin. Wrong role → apna dashboard pe redirect.

---

## PART D — DATA MODEL

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  role      Role     // CANDIDATE | COMPANY | ADMIN
  name      String
  phone     String?
  createdAt DateTime @default(now())
}

model Candidate {
  userId       String  @unique
  college      String
  gradYear     Int
  skills       String[]
  github       String
  linkedin     String?
  resumeUrl    String?
  videoUrl     String?
  tier         Tier?          // A | B | C
  availability Availability   // LOOKING | OPEN | PLACED
  adminNote    String?
}

model Company {
  userId          String @unique
  name            String
  website         String?
  contactPerson   String
  agreementSigned Boolean @default(false)
}

model College {
  id          String @id @default(cuid())
  name        String
  city        String
  tpoName     String?
  tpoContact  String?
  status      String   // PROSPECT | ACTIVE | PAST
  workshopFee Int?     // agar workshop bhi bech rahe ho
}

model Event {
  id               String   @id @default(cuid())
  slug             String   @unique
  title            String
  problemStatement String
  sponsorId        String?
  collegeId        String?
  mode             Mode     // ONLINE | OFFLINE
  venue            String?
  startAt          DateTime
  endAt            DateTime
  deadline         DateTime
  status           EventStatus

  // registration fee config                          ← naya
  registrationFee  Int      @default(20000)  // paise mein, ₹200
  depositAmount    Int      @default(10000)  // refundable part, ₹100
  isSponsoredFree  Boolean  @default(false)  // true → entry free, banner dikhe
}

model Registration {
  id            String  @id @default(cuid())
  eventId       String
  candidateId   String
  teamId        String?
  checkedIn     Boolean @default(false)

  // payment                                          ← naya
  paymentStatus String   // PENDING | PAID | WAIVED | FAILED
  razorpayOrderId   String?
  razorpayPaymentId String?
  amountPaid    Int      @default(0)
  refundStatus  String?  // NOT_DUE | DUE | PROCESSED
  refundId      String?
  refundedAt    DateTime?
}

model Team {
  id       String @id @default(cuid())
  eventId  String
  name     String
  joinCode String @unique
  leaderId String
}

model Submission {
  id            String @id @default(cuid())
  teamId        String
  title         String
  description   String
  repoUrl       String
  videoUrl      String
  stack         String[]
  contributions String     // per-member breakdown
  submittedAt   DateTime?
}

model Score {
  submissionId String
  candidateId  String     // INDIVIDUAL rating, team ka nahi
  demo         Int
  code         Int
  fit          Int
  viva         Int
  notes        String?
  rank         Int?
}

model Requirement {
  id        String @id @default(cuid())
  companyId String
  role      String
  stack     String[]
  openings  Int
  ctcMin    Int
  ctcMax    Int
  location  String
  urgency   String
  status    String
}

model Intro {              // REVENUE LEDGER — sabse important table
  id            String   @id @default(cuid())
  requirementId String
  candidateId   String
  status        IntroStatus  // SENT ACCEPTED INTERVIEWING OFFERED JOINED CLEARED PAID
  sentAt        DateTime @default(now())
  joinedAt      DateTime?
  clearsAt      DateTime?    // joinedAt + 90 days
  offerCtc      Int?
  feeAmount     Int?
  feeStatus     String?
}
```

---

## PART E — PAGES

### `/` Landing — company-focused

1. **Nav** — sticky, `--paper` bg, 1px bottom border. Logo left. Links: Events, For companies, For colleges, About. Right: black "Post a requirement →" button.

2. **Hero** — `--sky` background, 90vh
   - Mixed headline: *"Hire freshers who have* **already built** *something."*
   - Sub: *"Every FreshPools candidate has shipped working code in a live competition, passed a code review, and explained their own work on camera."*
   - Buttons: "Post a requirement →" (primary) | "Browse talent →" (secondary)
   - Below: mono line "VERIFIED THIS SEASON: N CANDIDATES"
     **Conditional — N real ho tabhi render karo. Zero hai toh line hata do.**

3. **Dashboard mockup** — hero ke neeche, half-cropped, section boundary overlap karta hua

4. **Company logo marquee** — mono eyebrow `✦ HIRING PARTNERS`
   **Conditional — partners zero hain toh section render mat karo.**

5. **Problem section** — `--paper` bg
   - Mixed headline: *"Not another resume pile."* / **"A verified shortlist."**
   - 3 stat blocks: screening hours wasted, % who fail a basic coding round, avg time-to-hire

6. **How verification works** — 4-card grid, colors cycle blue/white/coral/yellow
   - `01` Build under pressure — live competition, fixed deadline, real problem
   - `02` Git history check — commits spread out, ya deadline pe ek dump?
   - `03` Code review — humne khud padha hai, sirf output nahi
   - `04` Recorded viva — apna code khud explain kiya, 10 minutes

   *(Numbering yahan justified hai — ye actual sequence hai.)*

7. **Sample profiles** — 3 teaser cards, name partially masked, skills + tier badge + "Watch demo" (login-gated)

8. **For colleges strip** — coral block, one line + CTA → `/for-colleges`

9. **FAQ accordion**

10. **Final CTA** — black full-bleed block, white text, single button

11. **Footer** — 4 columns, mono labels

---

### `/hackathons` — events list

- **Upcoming** cards: title, date, mode, venue/college, prize pool, **fee display**, countdown, register button
- Fee display do state mein:
  - Normal: `ENTRY ₹200 · ₹100 REFUNDABLE`
  - Sponsored: `ENTRY ₹̶2̶0̶0̶ FREE · SPONSORED BY [COMPANY]` (yellow strip)
- **Past** cards: title, date, participant count, "view results"
- Filter: online / offline / city

---

### `/hackathons/[slug]` — event page

Sections in order:

1. **Hero** — title, sponsor logo, dates, mode, venue, prize pool, sticky Register button
2. **Fee banner** — agar `isSponsoredFree` true hai toh yellow strip: *"Entry is free — sponsored by [Company]"*. Warna fee + refund policy ek line mein.
3. **Countdown** — registration closes in X
4. **Problem statement** — agar sponsored hai: *"Presented by [Company]"*
5. **Tracks** (agar multiple)
6. **Timeline** — registration → kickoff → checkpoint → submission → judging → results
7. **Prizes**
8. **What you get even if you don't win** ← *ye section zaruri hai*
   - Verified profile on FreshPools
   - Direct company introductions
   - Certificate
9. **Judging criteria** — public rakho:
   - Working demo (30%) · Code quality (25%) · Problem fit (25%) · Viva (20%)
10. **Rules** — team 2-4, no pre-built projects, public repo mandatory, viva compulsory
11. **Fee & refund policy** — saaf likho:
    - *"₹200 entry. ₹100 attend karne par refund ho jata hai. Ye sirf logistics cover karta hai."*
    - *"FreshPools placement ya shortlist ke liye students se kabhi paisa nahi leta. Companies humein pay karti hain."* ← **ye line prominent rakho**
12. **FAQ**
13. **Register** CTA repeat

**Register flow:**
```
Register click
  → logged in?  no  → /signup (role auto = candidate, redirect back)
                yes → registration form
  → form: college, year, phone, GitHub, skills[], t-shirt size
  → team: [Create team] or [Join with code]
  → PAYMENT STEP
      isSponsoredFree?  yes → skip, status = WAIVED
                        no  → Razorpay order → checkout → webhook confirm
  → confirmation screen + email (receipt + refund policy)
  → /me/hackathons redirect
```

**Payment edge cases handle karo:**
- Payment fail → registration `PENDING` rahe, retry button dikhe
- Payment ke baad browser band → webhook se hi confirm hoga, page reload pe sahi state
- Event sponsored-free ho gaya **baad mein** → jo already pay kar chuke, unko full refund (admin bulk action)

---

### `/hackathons/[slug]/leaderboard`
- Event ke baad public
- Rank, team name, project title, demo video, repo link
- Top 10 pe "Verified" badge
- **Score numbers public mat karo** — sirf rank

---

### `/for-companies`

- Pitch + "how verification works"
- **Requirement form** (login ke bina bhi bhare — friction kam):
  - Company name, website, your name, email, phone
  - Role title, tech stack (tags), openings, CTC range, location/remote
  - When do you need them (immediate / 1 month / 3 months)
  - "Would you sponsor an event on this problem?" — yes / maybe / no
- Submit → tumhe email + `/admin/requirements` entry
- Thank you page: *"We'll send you matched profiles within 7 days"*
- Neeche: fee structure transparently — *"You pay only when a hire clears 90 days"*

---

### `/for-colleges`   ← v2 mein expand hua

Do offerings, do cards side by side:

**Card 1 — Hackathon (blue block)**
- Real company problem statement
- Industry connect for your students
- Placement pipeline
- Cost to college: zero (sponsor-funded)

**Card 2 — Workshop / Bootcamp (yellow block)**
- 2-day pre-event bootcamp
- Topics: git, code quality, building under deadline, interview prep
- Paid engagement — pricing on enquiry

**Enquiry form:** college name, city, your name + role (TPO/HOD), student count, department, preferred month, interested in (hackathon / workshop / both)

**Timing note page pe:** *"We schedule around your academic calendar — August–September and January work best."*

---

### App pages — design shift

Marketing pages editorial hain; app pages tight aur functional:
- Serif sirf page title mein, baaki Satoshi
- Data labels mono
- Tables: 1px `--ink` borders, no zebra stripes
- Status badges: flat color block + mono uppercase, no radius

**Candidate:** `/me` dashboard, `/me/profile`, `/me/hackathons`, `/me/team/[id]`, `/me/submission/[id]`, `/me/opportunities`
- `/me/hackathons` pe payment status + refund status dikhe

**Company:** `/co` dashboard, `/co/requirements`, `/co/talent`, `/co/talent/[id]`, `/co/shortlist`, `/co/pipeline`
- `/co/talent/[id]`: embedded demo video sabse upar, repo link, skills, hackathon history, admin note, resume
- **Contact details kahin nahi.** Actions: Save to shortlist | Request introduction

**Admin:** `/admin`, `/admin/events/[id]/registrations`, `/submissions`, `/scoring`, `/admin/talent`, `/admin/requirements`, `/admin/matching/[reqId]`, `/admin/intros`, `/admin/colleges`, `/admin/companies`
- **Registrations page pe naya:** payment status column, check-in toggle, aur **"Refund deposits for checked-in"** bulk action
- **Scoring page:** demo/code/fit/viva per **individual**, notes, tier assign, "onboard to talent pool" toggle
- **Intros page:** revenue ledger, 90-day timer visible, fee due alerts

---

## PART F — BUILD ORDER

**Phase 1 — foundation**
1. Next.js + TS + Tailwind v4, tokens as `@theme`
2. Fonts + `MixedHeadline` component
3. shadcn install, sab radius 0
4. Prisma schema + Neon connect
5. Auth.js email OTP + role middleware

**Phase 2 — public + admin (pehla event chalane layak)**
6. Landing page (sab sections, conditional wale conditional)
7. `/hackathons` + `/hackathons/[slug]` with fee states
8. Registration + team create/join
9. **Razorpay integration + webhook + refund flow**
10. Submission form + deadline lock
11. Admin: registrations (+payment/refund), submissions, scoring, tier assign

**Phase 3 — company side (pehli company ke baad)**
12. `/for-companies` + requirement form
13. `/for-colleges` + workshop enquiry
14. Talent pool + profile pages
15. Company dashboard + shortlist + pipeline
16. Admin matching → push shortlist
17. Intros ledger + 90-day timer

**Phase 4**
18. Emails (Resend), analytics, SEO/OG, a11y audit

---

## PART G — NON-NEGOTIABLES

**Product**
1. Candidate ka email/phone company ko **kabhi** mat dikhao. Har intro admin ke through. Ye pura revenue model hai.
2. Demo video mandatory — badge se zyada yahi convince karta hai.
3. Scoring individual-level, team-level nahi.
4. Har intro log ho — dispute mein proof.
5. **Koi paid tier, koi priority-for-payment, koi candidate subscription.** Registration fee sirf logistics hai, aur wo site pe explicitly likha ho.
6. Deposit refund automatic nahi — admin check-in verify karke trigger kare.

**Design**
7. Border radius zero, har jagah.
8. Shadow, gradient, glow — kahin nahi.
9. Har major headline mixed serif + sans.
10. Numbered markers sirf actual sequence pe.
11. Borders hamesha 1px solid ink. Gray nahi.
12. Numbers/logos jab tak real na ho, section render mat karo.

**Quality floor**
13. Mobile-first responsive, 360px tak
14. Visible keyboard focus rings (2px ink outline)
15. `prefers-reduced-motion` respected
16. WCAG AA — coral/yellow blocks pe **ink text hi**, white nahi
17. Har form Zod-validated, server side bhi
18. OTP aur payment endpoints rate-limited
19. Payment amount hamesha server se, client input se kabhi nahi
