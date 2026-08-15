import { NextResponse } from "next/server";
import { prisma, isDbConfigured } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { sendRegistrationReceipt, sendRefundProcessed } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The single source of truth for payment state.
 *
 * The browser callback is never trusted — a user can close the tab mid-payment,
 * and a malicious one can call any client route they like. Everything that
 * moves money is applied here, after the signature check.
 *
 * Handlers are idempotent: Razorpay retries, and a retry must not double-send
 * a receipt or overwrite a later state.
 */

type RazorpayEntity = {
  id: string;
  order_id?: string;
  amount?: number;
  payment_id?: string;
  notes?: Record<string, string>;
};

type WebhookBody = {
  event: string;
  payload: {
    payment?: { entity: RazorpayEntity };
    refund?: { entity: RazorpayEntity };
  };
};

export async function POST(request: Request) {
  // Read the RAW body — the signature is computed over the exact bytes sent.
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    console.warn("[webhook] rejected: bad or missing signature");
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (!isDbConfigured) {
    // Return 200 so Razorpay does not retry forever against a dev deployment.
    console.error("[webhook] no database configured — event dropped");
    return NextResponse.json({ received: true });
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(rawBody) as WebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  try {
    switch (body.event) {
      case "payment.captured":
      case "order.paid":
        await handlePaymentCaptured(body);
        break;
      case "payment.failed":
        await handlePaymentFailed(body);
        break;
      case "refund.processed":
        await handleRefundProcessed(body);
        break;
      case "refund.failed":
        await handleRefundFailed(body);
        break;
      default:
        // Unhandled events are acknowledged so they aren't retried.
        break;
    }
  } catch (error) {
    console.error(`[webhook] handler failed for ${body.event}`, error);
    // 500 asks Razorpay to retry, which is what we want for a transient fault.
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function findRegistration(entity: RazorpayEntity | undefined) {
  if (!entity) return null;

  // Prefer the order id; fall back to the note we set at order creation.
  if (entity.order_id) {
    const byOrder = await prisma.registration.findUnique({
      where: { razorpayOrderId: entity.order_id },
      include: {
        event: { select: { title: true, slug: true, depositAmount: true, sponsor: { select: { name: true } } } },
        candidate: { select: { user: { select: { email: true, name: true } } } },
      },
    });
    if (byOrder) return byOrder;
  }

  const registrationId = entity.notes?.registrationId;
  if (!registrationId) return null;

  return prisma.registration.findUnique({
    where: { id: registrationId },
    include: {
      event: { select: { title: true, slug: true, depositAmount: true, sponsor: { select: { name: true } } } },
      candidate: { select: { user: { select: { email: true, name: true } } } },
    },
  });
}

async function handlePaymentCaptured(body: WebhookBody) {
  const entity = body.payload.payment?.entity;
  const registration = await findRegistration(entity);
  if (!registration || !entity) {
    console.warn("[webhook] payment.captured for an unknown registration");
    return;
  }

  // Idempotency: a retry of an already-applied capture is a no-op.
  if (registration.paymentStatus === "PAID") return;

  await prisma.registration.update({
    where: { id: registration.id },
    data: {
      paymentStatus: "PAID",
      razorpayPaymentId: entity.id,
      amountPaid: entity.amount ?? 0,
      paidAt: new Date(),
      // The deposit only becomes refundable once check-in is verified by an
      // admin — NON-NEGOTIABLE #6. It is not marked DUE here.
      refundStatus: "NOT_DUE",
    },
  });

  const email = registration.candidate.user.email;
  if (email) {
    await sendRegistrationReceipt({
      to: email,
      name: registration.candidate.user.name ?? "there",
      eventTitle: registration.event.title,
      eventSlug: registration.event.slug,
      amountPaid: entity.amount ?? 0,
      depositAmount: registration.event.depositAmount,
      waived: false,
      sponsorName: registration.event.sponsor?.name,
    });
  }
}

async function handlePaymentFailed(body: WebhookBody) {
  const entity = body.payload.payment?.entity;
  const registration = await findRegistration(entity);
  if (!registration) return;

  // Never move a paid registration backwards on a late failure event.
  if (registration.paymentStatus === "PAID") return;

  await prisma.registration.update({
    where: { id: registration.id },
    data: { paymentStatus: "FAILED" },
  });
}

async function handleRefundProcessed(body: WebhookBody) {
  const entity = body.payload.refund?.entity;
  if (!entity?.payment_id) return;

  const registration = await prisma.registration.findFirst({
    where: { razorpayPaymentId: entity.payment_id },
    include: {
      event: { select: { title: true } },
      candidate: { select: { user: { select: { email: true, name: true } } } },
    },
  });
  if (!registration) return;
  if (registration.refundStatus === "PROCESSED") return;

  await prisma.registration.update({
    where: { id: registration.id },
    data: {
      refundStatus: "PROCESSED",
      refundId: entity.id,
      refundAmount: entity.amount ?? registration.refundAmount,
      refundedAt: new Date(),
    },
  });

  const email = registration.candidate.user.email;
  if (email) {
    await sendRefundProcessed({
      to: email,
      name: registration.candidate.user.name ?? "there",
      eventTitle: registration.event.title,
      amount: entity.amount ?? registration.refundAmount ?? 0,
    });
  }
}

async function handleRefundFailed(body: WebhookBody) {
  const entity = body.payload.refund?.entity;
  if (!entity?.payment_id) return;

  const registration = await prisma.registration.findFirst({
    where: { razorpayPaymentId: entity.payment_id },
    select: { id: true },
  });
  if (!registration) return;

  // Back to DUE so it reappears in the admin's refund queue.
  await prisma.registration.update({
    where: { id: registration.id },
    data: { refundStatus: "DUE", refundId: entity.id },
  });
}
