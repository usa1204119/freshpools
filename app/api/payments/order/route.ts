import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, isDbConfigured } from "@/lib/db";
import { createOrder, razorpayConfigured, publicKeyId } from "@/lib/razorpay";
import { paymentLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Creates a Razorpay order for a registration.
 *
 * The request body carries ONLY a registrationId. The amount is looked up from
 * the Event row on the server — the client has no say in what it is charged
 * (NON-NEGOTIABLE #19).
 */
export async function POST(request: Request) {
  if (!isDbConfigured || !razorpayConfigured) {
    return NextResponse.json(
      { error: "Payments are not configured on this deployment." },
      { status: 503 },
    );
  }

  const session = await auth();
  if (!session?.user || session.user.role !== "CANDIDATE") {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const { success } = await paymentLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json(
      { error: "Too many payment attempts. Try again in a while." },
      { status: 429 },
    );
  }

  let registrationId: string;
  try {
    const body = (await request.json()) as { registrationId?: unknown };
    if (typeof body.registrationId !== "string" || body.registrationId.length === 0) {
      return NextResponse.json({ error: "registrationId is required." }, { status: 400 });
    }
    registrationId = body.registrationId;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    select: {
      id: true,
      paymentStatus: true,
      razorpayOrderId: true,
      candidate: {
        select: {
          userId: true,
          user: { select: { name: true, email: true, phone: true } },
        },
      },
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          deadline: true,
          registrationFee: true,
          isSponsoredFree: true,
        },
      },
    },
  });

  if (!registration) {
    return NextResponse.json({ error: "Registration not found." }, { status: 404 });
  }

  // A user may only pay for their own registration.
  if (registration.candidate.userId !== session.user.id) {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  if (registration.paymentStatus === "PAID") {
    return NextResponse.json({ error: "Already paid." }, { status: 409 });
  }
  if (registration.paymentStatus === "WAIVED" || registration.event.isSponsoredFree) {
    return NextResponse.json({ error: "Entry is free for this event." }, { status: 409 });
  }
  if (registration.event.status !== "REGISTRATION_OPEN") {
    return NextResponse.json({ error: "Registration is closed." }, { status: 409 });
  }
  if (registration.event.deadline.getTime() < Date.now()) {
    return NextResponse.json({ error: "The deadline has passed." }, { status: 409 });
  }

  // ── The amount comes from here, and only from here. ──────────────────────
  const amount = registration.event.registrationFee;

  try {
    const order = await createOrder({
      amount,
      receipt: registration.id,
      notes: {
        registrationId: registration.id,
        eventId: registration.event.id,
        eventSlug: registration.event.slug,
      },
    });

    await prisma.registration.update({
      where: { id: registration.id },
      data: { razorpayOrderId: order.id, paymentStatus: "PENDING" },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: publicKeyId,
      eventTitle: registration.event.title,
      prefill: {
        name: registration.candidate.user.name ?? "",
        email: registration.candidate.user.email ?? "",
        contact: registration.candidate.user.phone ?? "",
      },
    });
  } catch (error) {
    console.error("[payments] order creation failed", error);
    return NextResponse.json(
      { error: "We couldn't start that payment. Try again." },
      { status: 502 },
    );
  }
}
