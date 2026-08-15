/**
 * Development seed.
 *
 * Everything here is obviously fictional and exists so the app can be clicked
 * through end to end. It must never run against production — the guard below
 * refuses unless SEED_CONFIRM=yes is set alongside a non-production NODE_ENV.
 *
 *   npm run db:push && npm run db:seed
 */
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";

// tsx runs this file directly, so nothing has loaded .env.local for us.
// Same precedence as Next: .env.local wins over .env.
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const prisma = new PrismaClient();

function joinCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(randomBytes(6))
    .map((byte) => alphabet[byte % alphabet.length])
    .join("");
}

function daysFromNow(days: number, hour = 10): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.SEED_CONFIRM !== "yes") {
    throw new Error(
      "Refusing to seed a production database. Set SEED_CONFIRM=yes if you really mean it.",
    );
  }

  console.log("Seeding…");

  // ── Admin ───────────────────────────────────────────────────────────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@freshpools.in";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      email: adminEmail,
      name: "FreshPools Admin",
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });
  console.log(`  admin: ${adminEmail}`);

  // ── College ─────────────────────────────────────────────────────────────
  const college = await prisma.college.upsert({
    where: { id: "seed-college-1" },
    update: {},
    create: {
      id: "seed-college-1",
      name: "Sample Institute of Technology",
      city: "Pune",
      tpoName: "Placement Cell",
      tpoEmail: "tpo@example.edu",
      status: "ACTIVE",
      studentCount: 1200,
      workshopFee: 75000,
    },
  });

  // ── Companies ───────────────────────────────────────────────────────────
  const sponsor = await prisma.company.upsert({
    where: { id: "seed-company-1" },
    update: {},
    create: {
      id: "seed-company-1",
      name: "Northwind Labs",
      website: "https://example.com",
      contactPerson: "Hiring Lead",
      contactEmail: "hiring@example.com",
      contactPhone: "9800000001",
      agreementSigned: true,
      // Left false on purpose: the public marquee must only ever show real
      // partners, and seed data is not real.
      isHiringPartner: false,
    },
  });

  const companyUser = await prisma.user.upsert({
    where: { email: "company@example.com" },
    update: { role: "COMPANY" },
    create: {
      email: "company@example.com",
      name: "Priya Raman",
      role: "COMPANY",
      phone: "9800000002",
      emailVerified: new Date(),
    },
  });

  const company = await prisma.company.upsert({
    where: { userId: companyUser.id },
    update: {},
    create: {
      userId: companyUser.id,
      name: "Cobalt Systems",
      website: "https://example.org",
      contactPerson: "Priya Raman",
      contactEmail: "company@example.com",
      contactPhone: "9800000002",
      agreementSigned: true,
    },
  });

  // ── Events: one open for registration, one completed ─────────────────────
  const openEvent = await prisma.event.upsert({
    where: { slug: "build-sprint-monsoon" },
    update: {},
    create: {
      slug: "build-sprint-monsoon",
      title: "Build Sprint: Monsoon",
      tagline: "Forty-eight hours, one real logistics problem, a live code review.",
      problemStatement: `Small delivery fleets in Indian cities lose hours every day to routes planned in a spreadsheet.

Build something that takes a list of deliveries and a handful of riders, and produces a route plan the rider can actually follow on a phone with patchy signal.

Constraints that matter:
· It has to work offline once the plan is loaded.
· A dispatcher must be able to override any leg of the route by hand.
· The rider's screen has to be usable one-handed, on a bike, in the rain.

We are not looking for a perfect optimiser. We are looking for something that runs, that handles a bad input without crashing, and that you can explain line by line.`,
      sponsorId: sponsor.id,
      collegeId: college.id,
      mode: "OFFLINE",
      venue: "Main Auditorium",
      city: "Pune",
      startAt: daysFromNow(21, 9),
      endAt: daysFromNow(23, 18),
      deadline: daysFromNow(18, 23),
      status: "REGISTRATION_OPEN",
      prizePool: 15000000, // ₹1,50,000
      minTeamSize: 2,
      maxTeamSize: 4,
      tracks: ["Rider experience", "Dispatcher tooling", "Route intelligence"],
      registrationFee: 20000, // ₹200
      depositAmount: 10000, // ₹100
      isSponsoredFree: false,
    },
  });

  await prisma.prize.deleteMany({ where: { eventId: openEvent.id } });
  await prisma.prize.createMany({
    data: [
      { eventId: openEvent.id, rank: "1st", amount: 7500000, sortOrder: 1 },
      { eventId: openEvent.id, rank: "2nd", amount: 4500000, sortOrder: 2 },
      { eventId: openEvent.id, rank: "3rd", amount: 3000000, sortOrder: 3 },
      {
        eventId: openEvent.id,
        rank: "Best viva",
        perk: "A recorded mock interview with a senior engineer",
        sortOrder: 4,
      },
    ],
  });

  const pastEvent = await prisma.event.upsert({
    where: { slug: "winter-code-jam" },
    update: {},
    create: {
      slug: "winter-code-jam",
      title: "Winter Code Jam",
      tagline: "Our first sponsored event — entry was free.",
      problemStatement:
        "Build a tool that helps a small clinic manage appointments without a receptionist.",
      sponsorId: sponsor.id,
      mode: "ONLINE",
      startAt: daysFromNow(-60, 9),
      endAt: daysFromNow(-58, 18),
      deadline: daysFromNow(-63, 23),
      status: "COMPLETED",
      prizePool: 5000000,
      registrationFee: 20000,
      depositAmount: 10000,
      isSponsoredFree: true, // exercises the yellow sponsored banner
    },
  });

  // ── Candidates ──────────────────────────────────────────────────────────
  const people = [
    {
      email: "asha@example.com",
      name: "Asha Menon",
      college: "Sample Institute of Technology",
      gradYear: new Date().getFullYear() + 1,
      skills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
      github: "https://github.com/example-asha",
      tier: "A" as const,
    },
    {
      email: "rohit@example.com",
      name: "Rohit Bansal",
      college: "Sample Institute of Technology",
      gradYear: new Date().getFullYear() + 1,
      skills: ["Python", "FastAPI", "PostgreSQL", "Docker"],
      github: "https://github.com/example-rohit",
      tier: "B" as const,
    },
    {
      email: "meera@example.com",
      name: "Meera Iyer",
      college: "Another Engineering College",
      gradYear: new Date().getFullYear(),
      skills: ["Flutter", "Dart", "Firebase"],
      github: "https://github.com/example-meera",
      tier: "A" as const,
    },
  ];

  const candidates = [];
  for (const person of people) {
    const user = await prisma.user.upsert({
      where: { email: person.email },
      update: {},
      create: {
        email: person.email,
        name: person.name,
        role: "CANDIDATE",
        phone: "9800000000",
        emailVerified: new Date(),
      },
    });

    const candidate = await prisma.candidate.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        college: person.college,
        gradYear: person.gradYear,
        skills: person.skills,
        github: person.github,
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        tier: person.tier,
        inTalentPool: true,
        availability: "LOOKING",
        adminNote: "Seed record — replace before going live.",
      },
    });
    candidates.push(candidate);
  }

  // ── A completed team + submission + per-person scores ───────────────────
  const existingTeam = await prisma.team.findFirst({
    where: { eventId: pastEvent.id, name: "Nightshift" },
    select: { id: true },
  });

  const team =
    existingTeam ??
    (await prisma.team.create({
      data: {
        eventId: pastEvent.id,
        name: "Nightshift",
        joinCode: joinCode(),
        leaderId: candidates[0].id,
        members: {
          create: [
            { candidateId: candidates[0].id },
            { candidateId: candidates[1].id },
          ],
        },
      },
      select: { id: true },
    }));

  for (const candidate of candidates.slice(0, 2)) {
    await prisma.registration.upsert({
      where: {
        eventId_candidateId: { eventId: pastEvent.id, candidateId: candidate.id },
      },
      update: {},
      create: {
        eventId: pastEvent.id,
        candidateId: candidate.id,
        teamId: team.id,
        checkedIn: true,
        checkedInAt: daysFromNow(-60),
        // Sponsored-free event, so nothing was charged.
        paymentStatus: "WAIVED",
        refundStatus: "NOT_DUE",
        tshirtSize: "M",
      },
    });
  }

  const submission = await prisma.submission.upsert({
    where: { teamId: team.id },
    update: {},
    create: {
      teamId: team.id,
      title: "Clinic Queue",
      description:
        "A single-screen appointment board a clinic can run on one shared tablet. Patients check in by phone number, the board reorders itself, and the doctor sees who is actually waiting.",
      repoUrl: "https://github.com/example-asha/clinic-queue",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      stack: ["React", "Node.js", "PostgreSQL"],
      contributions:
        "Asha — check-in flow, database schema, the reordering logic\nRohit — API, deployment, the offline fallback",
      submittedAt: daysFromNow(-58, 17),
    },
  });

  const scoreData = [
    { candidateId: candidates[0].id, demo: 27, code: 22, fit: 23, viva: 18, rank: 1 },
    { candidateId: candidates[1].id, demo: 25, code: 19, fit: 21, viva: 15, rank: 2 },
  ];

  for (const score of scoreData) {
    await prisma.score.upsert({
      where: {
        submissionId_candidateId: {
          submissionId: submission.id,
          candidateId: score.candidateId,
        },
      },
      update: {},
      create: {
        submissionId: submission.id,
        ...score,
        notes: "Seed score — internal note, never shown to a company.",
      },
    });
  }

  // ── A requirement to exercise matching and the ledger ────────────────────
  const existingRequirement = await prisma.requirement.findFirst({
    where: { companyId: company.id, role: "Backend Engineer (Fresher)" },
    select: { id: true },
  });

  if (!existingRequirement) {
    await prisma.requirement.create({
      data: {
        companyId: company.id,
        role: "Backend Engineer (Fresher)",
        stack: ["Node.js", "PostgreSQL", "TypeScript"],
        openings: 2,
        ctcMin: 600000,
        ctcMax: 900000,
        location: "Bengaluru",
        isRemote: true,
        urgency: "1_MONTH",
        sponsorInterest: "maybe",
        status: "NEW",
      },
    });
  }

  console.log("Done.");
  console.log("");
  console.log("Sign in with any of these — the OTP is printed to the server log");
  console.log("when RESEND_API_KEY is unset:");
  console.log(`  admin     ${adminEmail}`);
  console.log("  company   company@example.com");
  console.log("  candidate asha@example.com");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
