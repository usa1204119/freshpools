import type { FaqItem } from "@/components/marketing/faq";

/**
 * All marketing copy lives here so a non-developer can edit it without
 * touching JSX.
 *
 * Rule for numbers on this page: state only what is true by construction —
 * facts about how FreshPools works, which we control and can stand behind.
 * Market statistics are not used, because an unverifiable figure on the
 * landing page is the same category of mistake as a fake logo in the marquee.
 * FreshPools' own *counts* (candidates verified, partners) are never hardcoded
 * here either — they come from the database, and the section hides itself when
 * the count is zero.
 */

export const POSITIONING = "Verified fresher talent, proven through competitive nature.";

export const HERO = {
  headline: "Hire freshers who have **already built** something.",
  sub: "Every FreshPools candidate has shipped working code in a live competition, passed a code review, and explained their own work on camera.",
} as const;

/**
 * Each of these is a fact about our own process, not a market statistic.
 * If you change how verification works, change these too.
 */
export const PROBLEM_STATS = [
  {
    value: "4",
    label:
      "independent checks every candidate clears before their name reaches you — build, git history, code review, recorded viva.",
    source: "Every profile, no exceptions",
  },
  {
    value: "10 min",
    label:
      "on camera explaining their own architecture and defending their choices. This is the part a resume cannot fake.",
    source: "Recorded, and yours to watch",
  },
  {
    value: "90 days",
    label:
      "a hire must stay before we invoice you. No listing fee, no subscription, nothing to pay up front.",
    source: "You carry no risk while we search",
  },
] as const;

/** A real sequence — so numbered markers are justified here. */
export const VERIFICATION_STEPS = [
  {
    heading: "Build under pressure",
    body: "A live competition, a fixed deadline, and a real problem written by a hiring company. No take-home they had a week to polish.",
    icon: "◷",
  },
  {
    heading: "Git history check",
    body: "We read the commit log. Work spread across the event, or one dump at the deadline? The history tells us who actually built it.",
    icon: "⑂",
  },
  {
    heading: "Code review",
    body: "A human on our team reads the repository — structure, naming, error handling, tests. We review the code, not just the output.",
    icon: "⌗",
  },
  {
    heading: "Recorded viva",
    body: "Ten minutes on camera explaining their own architecture and defending their choices. This is the part a resume can never fake.",
    icon: "▷",
  },
] as const;

export const JUDGING_CRITERIA = [
  { label: "Working demo", weight: 30, note: "Does it run, and does it do the thing?" },
  { label: "Code quality", weight: 25, note: "Structure, naming, error handling, tests." },
  { label: "Problem fit", weight: 25, note: "Did they solve the stated problem?" },
  { label: "Viva", weight: 20, note: "Can they explain and defend their own work?" },
] as const;

export const DEFAULT_RULES = [
  "Teams of 2–4. Solo entries are not accepted — we score collaboration too.",
  "No pre-built projects. The repository must be created after kickoff.",
  "The repository must be public for the duration of judging.",
  "The viva is compulsory. Skip it and the submission is not scored.",
  "Libraries and AI assistants are allowed — you still have to explain every line.",
] as const;

export const EVENT_TIMELINE = [
  { label: "Registration", note: "Form, team, entry fee" },
  { label: "Kickoff", note: "Problem statement released" },
  { label: "Checkpoint", note: "Mid-event progress review" },
  { label: "Submission", note: "Repo + demo video locked" },
  { label: "Judging", note: "Code review + recorded viva" },
  { label: "Results", note: "Public leaderboard" },
] as const;

export const NON_WINNER_BENEFITS = [
  {
    heading: "A verified profile",
    body: "Your reviewed code, your demo video and your viva stay on your FreshPools profile. That profile is what companies actually browse.",
  },
  {
    heading: "Direct company introductions",
    body: "We introduce candidates to hiring companies ourselves. Winning helps, but a strong review and a clear viva matter more.",
  },
  {
    heading: "A certificate that means something",
    body: "It names the problem you solved, the stack you used and the review you passed — not just that you showed up.",
  },
] as const;

export const LANDING_FAQ: FaqItem[] = [
  {
    q: "How is this different from a job board?",
    a: "A job board hands you applications. We hand you a shortlist of people whose code we have read and whose explanation of that code we have watched. You are reviewing evidence, not claims.",
  },
  {
    q: "When do we pay you?",
    a: "Only when a hire clears 90 days with you. No listing fee, no subscription, no charge for viewing profiles. If the person does not stay, the fee is not due.",
  },
  {
    q: "Can we see a candidate's contact details before an introduction?",
    a: "No. Every introduction goes through us, with the candidate's consent. This protects candidates from spam and keeps the process accountable on both sides.",
  },
  {
    q: "Do students pay you for placement?",
    a: "Never. Students pay a small entry fee for an event, half of which is refunded when they turn up, and it covers logistics only. There is no paid tier and no way to buy a better position in a shortlist.",
  },
  {
    q: "What if the candidate looks good but fails our own interview?",
    a: "That is a fine outcome and it costs you nothing — you only ever pay on a hire that lasts. Tell us what missed, and we will use it to sharpen the next shortlist.",
  },
  {
    q: "How many candidates come out of one event?",
    a: "It varies with the event size and the bar. We would rather send you four people we can vouch for than forty we cannot.",
  },
];

export const EVENT_FAQ: FaqItem[] = [
  {
    q: "What does the entry fee actually pay for?",
    a: "Venue, internet, food, and the prize pool. It is not a placement fee — FreshPools never charges students for placement or shortlisting.",
  },
  {
    q: "How do I get the refundable half back?",
    a: "Turn up and check in at the event. Once an organiser has verified your check-in, we trigger the refund to your original payment method. It usually lands in 5–7 working days.",
  },
  {
    q: "Can I register without a team?",
    a: "You can register on your own and then either create a team and share the join code, or join an existing team with their code. You must be in a team of 2–4 before the submission deadline.",
  },
  {
    q: "What if my payment fails?",
    a: "Your registration stays in a pending state and a retry button appears on your dashboard. Nothing is lost — retry when you are ready.",
  },
  {
    q: "Is the viva really compulsory?",
    a: "Yes. It is the single most convincing thing in your profile, and a submission without one is not scored.",
  },
  {
    q: "Do I have to win to get introduced to a company?",
    a: "No. Rank is only one input. A clear viva and clean code on a mid-table project frequently beats a flashy demo nobody can explain.",
  },
];

export const COMPANY_FAQ: FaqItem[] = [
  {
    q: "What does a shortlist look like?",
    a: "Four to eight profiles, each with a demo video, a public repository, our written code-review note, and the skills we actually observed. No contact details until you request an introduction.",
  },
  {
    q: "How long until we see profiles?",
    a: "Seven days from a submitted requirement. If we do not have a match in the current pool, we tell you that instead of padding the list.",
  },
  {
    q: "What is the placement fee?",
    a: "A percentage of first-year CTC, agreed in writing before any introduction, invoiced only after the hire completes 90 days.",
  },
  {
    q: "Can we sponsor an event around our own problem statement?",
    a: "Yes, and it is the fastest way to see candidates work on something that resembles your real stack. Sponsorship also makes entry free for the students at that event.",
  },
];

export const COLLEGE_FAQ: FaqItem[] = [
  {
    q: "What does the college pay for a hackathon?",
    a: "Nothing. Hackathons are funded by the sponsoring company. We need a hall, power, internet and your students.",
  },
  {
    q: "How is the workshop different?",
    a: "The workshop is a paid two-day bootcamp we run before an event — git discipline, code quality, building to a deadline, and interview preparation. Pricing depends on batch size.",
  },
  {
    q: "How much of our academic calendar does this take?",
    a: "A hackathon is one weekend. A workshop is two days. We schedule around your calendar — August–September and January work best.",
  },
  {
    q: "Do we get placement data we can report?",
    a: "Yes. You get participation numbers, verified profile counts, and a record of every company introduction that came out of your campus.",
  },
];

export const COLLEGE_OFFERINGS = [
  {
    color: "blue" as const,
    eyebrow: "Offering 01",
    title: "Hackathon on campus",
    price: "Zero cost to the college",
    priceNote: "Sponsor-funded",
    points: [
      "A real problem statement written by a hiring company",
      "Industry mentors on the floor for the full event",
      "Every participant leaves with a verified profile",
      "A placement pipeline your TPO can actually track",
      "Participation and outcome data you can report",
    ],
  },
  {
    color: "yellow" as const,
    eyebrow: "Offering 02",
    title: "Workshop / bootcamp",
    price: "Paid engagement",
    priceNote: "Pricing on enquiry",
    points: [
      "Two days, run on campus, before the event",
      "Git discipline and readable commit history",
      "Code quality: structure, naming, error handling, tests",
      "Building something shippable against a deadline",
      "Interview preparation and mock technical viva",
    ],
  },
] as const;

export const COMPANY_URGENCY = [
  { value: "IMMEDIATE", label: "Immediately" },
  { value: "1_MONTH", label: "Within a month" },
  { value: "3_MONTHS", label: "Within three months" },
] as const;

export const SPONSOR_INTEREST = [
  { value: "yes", label: "Yes", description: "Fund an event around our problem" },
  { value: "maybe", label: "Maybe", description: "Tell us what it involves" },
  { value: "no", label: "No", description: "Just the shortlist for now" },
] as const;

export const TSHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export const CONTACT_ROLES = [
  "TPO / Placement Officer",
  "HOD",
  "Dean",
  "Faculty coordinator",
  "Student council",
  "Other",
] as const;
