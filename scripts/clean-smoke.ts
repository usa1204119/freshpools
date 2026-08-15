/**
 * Removes rows created by scripts/e2e-smoke.mjs.
 *
 * The smoke test writes real records to a real database, so it needs a real
 * cleanup. Matches only the slug prefix it generates, so nothing else is
 * touched.
 */
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const prisma = new PrismaClient();

async function main() {
  const events = await prisma.event.findMany({
    where: { slug: { startsWith: "smoke-event-" } },
    select: { id: true, slug: true },
  });

  if (events.length === 0) {
    console.log("Nothing to clean.");
    return;
  }

  // Registrations, teams and submissions cascade from Event.
  const { count } = await prisma.event.deleteMany({
    where: { id: { in: events.map((event) => event.id) } },
  });

  console.log(`Removed ${count} smoke event(s):`);
  for (const event of events) console.log(`  ${event.slug}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
