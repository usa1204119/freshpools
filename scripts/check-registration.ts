/**
 * Prints the live payment state of recent registrations.
 * Used to confirm what a webhook actually did to the database.
 *
 *   npx tsx scripts/check-registration.ts
 */
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.registration.findMany({
    orderBy: { updatedAt: "desc" },
    take: 8,
    select: {
      id: true,
      paymentStatus: true,
      amountPaid: true,
      paidAt: true,
      razorpayOrderId: true,
      razorpayPaymentId: true,
      refundStatus: true,
      refundAmount: true,
      checkedIn: true,
      updatedAt: true,
      event: { select: { title: true, registrationFee: true, depositAmount: true } },
      candidate: { select: { user: { select: { name: true, email: true } } } },
    },
  });

  if (rows.length === 0) {
    console.log("No registrations.");
    return;
  }

  for (const row of rows) {
    console.log("─".repeat(64));
    console.log(`${row.candidate.user.name}  ·  ${row.event.title}`);
    console.log(`  registration : ${row.id}`);
    console.log(`  payment      : ${row.paymentStatus}`);
    console.log(`  amountPaid   : ${row.amountPaid} paise`);
    console.log(`  paidAt       : ${row.paidAt?.toISOString() ?? "—"}`);
    console.log(`  order id     : ${row.razorpayOrderId ?? "—"}`);
    console.log(`  payment id   : ${row.razorpayPaymentId ?? "—"}`);
    console.log(`  refund       : ${row.refundStatus}${row.refundAmount ? ` (${row.refundAmount} paise)` : ""}`);
    console.log(`  checked in   : ${row.checkedIn}`);
    console.log(`  updated      : ${row.updatedAt.toISOString()}`);
  }
  console.log("─".repeat(64));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
