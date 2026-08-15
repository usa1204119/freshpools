# FreshPools — UI/UX Redesign Prompt (v3)

> Supersedes the design system in `freshpools-build-prompt.md` (PART B) and the
> navigation in PART E. Everything else in v2 still stands.
>
> **Reference:** https://swiftbridge.web.app — the same team's other product.
> The goal is one visual language across both, at SwiftBridge's level of finish.
>
> **Diagnosis being fixed:** dull · congested · hard to navigate.

---

## PART 0 — WHAT IS AND ISN'T CHANGING

### Overridden (design rules #7–#12 from v2)

| v2 rule | v3 replacement |
|---|---|
| #7 Border radius zero everywhere | Radius scale reinstated, 8–28px |
| #8 No shadow / gradient / glow | Soft shadows + gradient washes allowed |
| #11 Borders always 1px solid ink | **Soft hairline is now the default**; ink reserved for emphasis |
| Flat `--paper` / `--sky` backgrounds | Gradient page washes + background line-art |

### Unchanged — do not touch

**Product rules #1–#6.** Candidate contact details never reach a company;
demo video mandatory; scoring per individual; every intro logged; students never
pay for placement; refunds are admin-triggered. These are enforced in
`lib/talent.ts`, the Prisma schema and the server actions — a visual redesign
must not alter a single query shape.

**Quality floor #13–#19.** Mobile-first to 360px; visible focus rings;
`prefers-reduced-motion`; WCAG AA contrast; Zod on the server; rate-limited OTP
and payment endpoints; payment amounts always server-side.

**The mixed headline.** Serif + heavy sans is identical on both sites and is the
strongest shared signal. Keep `MixedHeadline` exactly as-is, including the
14-character nowrap rule.

---

## PART 1 — WHY IT CURRENTLY READS AS DULL AND CONGESTED

Three specific causes, in order of impact. Fix them in this order.

**1. Every border is 1px solid black.**
Cards, tiles, inputs, badges, table cells, grid gaps — all `#111111`. The eye
gets no hierarchy, so a page of cards reads as a heavy grid. This is the single
biggest contributor and the cheapest to fix.

**2. Sections are packed at 120px with dense internal spacing.**
SwiftBridge breathes at roughly 160px with far more air inside each block.

**3. Backgrounds are two flat colours.**
`--paper` and `--sky` alternate with nothing behind them. SwiftBridge's hero has
a gradient wash plus a faint geometric line-art motif, which is what stops a
large empty area reading as unfinished.

---

## PART 2 — DESIGN SYSTEM v3

### Surfaces

```css
--paper:     #F2F0EB;   /* warm off-white, unchanged */
--sky-50:    #F4F8FE;   /* new — lightest wash */
--sky-100:   #E3EDFB;   /* existing sky */
--sky-200:   #CFE0F9;   /* new — deeper accent wash */
--ink:       #111111;
--ink-muted: #5C5A55;

/* Hero / section washes — new in v3 */
--wash-hero: linear-gradient(180deg,
              var(--sky-100) 0%,
              var(--sky-50) 55%,
              var(--paper) 100%);
--wash-soft: linear-gradient(180deg, var(--sky-50) 0%, var(--paper) 100%);
```

### Lines — the key change

```css
--line:      #111111;              /* EMPHASIS only */
--line-soft: rgba(17,17,17,0.10);  /* NEW — the default */
--line-mid:  rgba(17,17,17,0.18);  /* NEW — hover / active */
```

**Rule:** default to `--line-soft`. Use solid ink only when the element is
deliberately loud — the ink CTA block, a selected filter chip, a status badge,
the black stat tile. If a screen has more than ~3 ink borders, it is too heavy.

### Radius

```css
--radius-sm:   8px;    /* chips, badges, skill tags */
--radius-md:   12px;   /* buttons, inputs, small cards */
--radius-lg:   20px;   /* cards, panels, form sections */
--radius-xl:   28px;   /* device mockup frame, hero panels */
--radius-full: 9999px; /* avatars, pills, the social-proof stack */
```

Remove the `--radius-*: initial` kill switch from `app/globals.css`. Same for
`--shadow-*`, `--drop-shadow-*` and `--blur-*`.

### Shadows — soft and low-contrast only

```css
--shadow-sm: 0 1px 2px rgba(17,17,17,.04), 0 1px 3px rgba(17,17,17,.06);
--shadow-md: 0 4px 12px rgba(17,17,17,.06), 0 2px 4px rgba(17,17,17,.04);
--shadow-lg: 0 12px 32px rgba(17,17,17,.08), 0 4px 8px rgba(17,17,17,.04);
```

No coloured glows, no hard offsets, no shadow on flat colour blocks. Shadow
signals elevation — a card that lifts off the page — not decoration.

### Accent blocks

Unchanged values, changed usage:

```css
--block-blue:   #BDD7F5;
--block-coral:  #F2B5A0;
--block-yellow: #FAE243;
--block-white:  #FFFFFF;
--block-ink:    #111111;   /* white text */
```

v2 cycled blue → white → coral → yellow across every grid, which made whole
pages look like a colour test. **v3: white is the default card**; accent blocks
are used to mark *one* thing per section — the key metric, the recommended
option, the thing you want clicked. WCAG AA still applies: ink text on coral and
yellow, never white.

### Spacing

```
Section padding : 96px mobile / 160px desktop   (was 64 / 120)
Card padding    : 28px mobile / 36px desktop    (was 32)
Grid gap        : 20px  (was 1px flush)
Container       : 1280px max, 24px / 40px gutters
Baseline        : 8px
```

### Typography

Scale unchanged. Two changes:

- **Hero headline is centred** (v2 was left-aligned), matching SwiftBridge.
  Subpage `PageHero` stays left-aligned — it is a header, not a hero.
- Hero h1 goes to **96px** at `xl` (was 88px), still 44px on mobile.

### Motion

v2 allowed three animations. v3 adds two, both subtle:

4. **Background line-art** drifts very slowly (60s+ loop, ≤8px travel).
5. **Logo marquee edges** fade via mask, not opacity animation.

`prefers-reduced-motion: reduce` still disables everything.

---

## PART 3 — NAVIGATION & INFORMATION ARCHITECTURE

### Top nav — 5 items, audience-first

```
[FreshPools]   How it works · For companies · For colleges · Events · About
                                            [Post a requirement →]
```

- Left-aligned logo, links centre-left, ink CTA far right (keep current layout —
  SwiftBridge centres its nav, but our CTA must stay dominant).
- **Active state:** 2px ink underline on the current section, not just on hover.
- Sticky, `--wash-soft` background with `--line-soft` bottom border and a
  backdrop blur once scrolled past 40px.
- Mobile: full-screen overlay panel, not the current inline dropdown.

### New page: `/how-it-works`

The four-step verification story is the single most convincing thing FreshPools
has and it currently exists only as a section on the landing page. Give it a
page: the four checks in depth, the public judging rubric, what a company
receives, and what happens to a candidate's data.

### Long-page navigation — fixes "hard to find stuff"

`/hackathons/[slug]` has **13 sections** with no way to navigate them.

- Add a **sticky in-page TOC** on the left at `lg+` (Problem · Tracks · Timeline
  · Prizes · Judging · Rules · Fees · FAQ), with scroll-spy active state.
- Below `lg`, collapse it into a horizontal scrollable chip row pinned under the
  nav.
- Apply the same pattern to `/for-companies` and `/for-colleges`.

### App areas

- **Breadcrumbs** on every nested page (`Admin › Events › Build Sprint ›
  Registrations`). Currently there is only a single back-link.
- Sidebar nav for `/admin` at `lg+` instead of the horizontal strip — nine items
  in a scrolling row is the reason admin feels hard to navigate.
- Keep the horizontal strip for `/me` and `/co`, which have 4–6 items.

### Footer

Expand from 4 columns to include a newsletter capture and legal links, matching
SwiftBridge. Add `Privacy` and `Terms` pages (stub content is fine — they're
referenced from forms already).

---

## PART 4 — NEW COMPONENTS

**`BackgroundArt`** — inline SVG, faint geometric network/bridge motif in
`--sky-200` at ~40% opacity, absolutely positioned behind hero content,
`aria-hidden`, drifts slowly. Must not affect layout or interactivity.

**`SocialProof`** — overlapping circular avatars (initials on pastel accent
fills) + `+N` pill + five ink stars + mono caption.
**Conditional, per non-negotiable #12:** renders only when the count is real and
non-zero. With no data it does not render — same rule as the hero verified line
and the partner marquee.

**`DeviceFrame`** — `--radius-xl` bezel, `--line-soft` border, `--shadow-lg`,
light inner surface. Wraps the existing dashboard mockup. This is the one place
a large radius is the point.

**`LogoMarquee` (revised)** — add a descriptive mono eyebrow ("Hiring partners
this season") and CSS `mask-image` fade on both edges. Still renders nothing when
there are no real partners.

**`SectionNav`** — the sticky in-page TOC described above, with
IntersectionObserver scroll-spy.

**`Breadcrumbs`** — app areas, with correct `aria-label="Breadcrumb"` and
`aria-current="page"`.

---

## PART 5 — PAGE-BY-PAGE

### `/` Landing

1. Nav (new 5-item, active state)
2. **Hero — centred**, gradient wash, `BackgroundArt` behind, h1 96px,
   two CTAs, `SocialProof` below *(conditional)*
3. `DeviceFrame` mockup, overlapping the section boundary as now
4. `LogoMarquee` with eyebrow + edge fade *(conditional)*
5. Problem — three stat blocks, one accent + two white
6. How verification works — four cards, **white with one accent**, linking to
   the new `/how-it-works`
7. Sample profiles *(conditional)*
8. For-colleges strip — coral
9. FAQ
10. Final CTA — ink block
11. Footer (expanded)

### `/how-it-works` — new

Hero → the four checks in depth (alternating image/text rows) → public judging
rubric → what a company receives → what a candidate keeps → CTA.

### `/hackathons/[slug]`

Content order unchanged. Add `SectionNav`, soften every border, apply the radius
scale, add generous spacing. The fee banner and the "students never pay" block
must remain visually prominent — they are trust elements, not decoration.

### `/for-companies` · `/for-colleges`

Add `SectionNav`. Form sections get `--radius-lg`, soft borders, and more
internal spacing — the current forms are the most congested screens on the site.

### App areas (`/me`, `/co`, `/admin`)

Card radius, soft borders, breadcrumbs, admin sidebar. Tables: keep 1px
structure but switch cell borders to `--line-soft`, keep the header row ink.
**No zebra stripes** — that rule survives.

---

## PART 6 — BUILD ORDER

**Phase 1 — tokens.** Rewrite `app/globals.css`: remove the radius/shadow kill
switches, add radius + shadow + wash + soft-line tokens. Nothing else changes,
but the whole site will visibly soften. Verify contrast still passes AA.

**Phase 2 — primitives.** `Block`, `Button`, `Field`, `StatusBadge`,
`DataTable`. Default to soft borders and the radius scale. This propagates
everywhere for free.

**Phase 3 — nav & IA.** 5-item nav with active state, mobile overlay,
breadcrumbs, admin sidebar, expanded footer, `/privacy` + `/terms` stubs.

**Phase 4 — hero & landing.** Centred hero, `BackgroundArt`, `DeviceFrame`,
`SocialProof`, revised marquee.

**Phase 5 — `/how-it-works`** and `SectionNav` on the three long pages.

**Phase 6 — app areas.** Cards, tables, breadcrumbs, admin sidebar.

**Phase 7 — verification.** Screenshot every page at 390 / 768 / 1366 and
compare against SwiftBridge. Re-run `npm run check`, `npm run smoke`.

---

## PART 7 — ACCEPTANCE CHECKS

**Visual**
- [ ] No screen has more than ~3 solid-ink borders
- [ ] Hero is centred with a gradient wash and visible background art
- [ ] Device mockup has a `--radius-xl` bezel and soft elevation
- [ ] Marquee fades at both edges
- [ ] Sections breathe at 160px desktop
- [ ] Mixed serif/sans headline unchanged, no mid-phrase emphasis breaks

**Navigation**
- [ ] 5 nav items with a visible active state
- [ ] Long pages have working scroll-spy section nav
- [ ] Every nested app page has breadcrumbs
- [ ] Admin uses a sidebar at `lg+`
- [ ] Mobile nav is a full-screen overlay

**Not broken**
- [ ] `npm run check` green (typecheck + 98 tests + build)
- [ ] `npm run smoke` 15/15
- [ ] No company-facing query returns `email`, `phone` or `adminNote`
- [ ] Conditional sections still hide with no data — the honest-empty-state rule
      survives the redesign
- [ ] AA contrast holds on coral and yellow (ink text only)
- [ ] Focus rings visible; reduced-motion disables all five animations

---

## PART 8 — RISKS

**Contrast.** Soft hairlines on light washes can fail AA for *non-text* UI
boundaries (3:1). Check every input and card edge, not just text.

**Losing the identity.** FreshPools' sharpness was deliberate. If, once
Phase 1–2 land, it reads as generic, the fix is not more radius — it is
recommitting to ink borders on the few loud elements and to the mixed headline.
Review after Phase 2 before continuing.

**Honest empty states.** The redesign adds three new conditional components
(`SocialProof`, revised marquee, sample profiles). Each must render *nothing*
rather than a zero or a placeholder. This has already caused one real bug — the
`gap-px`/`bg-ink` grid trick rendered empty cells as solid black rectangles.
