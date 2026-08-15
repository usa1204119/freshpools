"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatPaise } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadCheckoutScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${CHECKOUT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

type OrderResponse = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  eventTitle: string;
  prefill: { name: string; email: string; contact: string };
};

/**
 * Opens Razorpay checkout for a registration.
 *
 * The success handler does NOT mark anything paid — it only refreshes the page
 * so the server can report whatever the webhook has recorded. If the user
 * closes the browser mid-payment, the webhook still lands and the next page
 * load shows the correct state.
 */
export function RazorpayCheckout({
  registrationId,
  amount,
  label = "Pay and confirm",
  disabled,
}: {
  registrationId: string;
  amount: number;
  label?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const start = useCallback(async () => {
    setBusy(true);
    setError(null);

    try {
      const scriptReady = await loadCheckoutScript();
      if (!scriptReady || !window.Razorpay) {
        setError("Couldn't load the payment window. Check your connection.");
        return;
      }

      const response = await fetch("/api/payments/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(payload.error ?? "We couldn't start that payment.");
        return;
      }

      const order = (await response.json()) as OrderResponse;

      const checkout = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "FreshPools",
        description: order.eventTitle,
        prefill: order.prefill,
        notes: { registrationId },
        theme: { color: "#111111", backdrop_color: "#F2F0EB" },
        handler: () => {
          // Confirmation comes from the webhook, not from here.
          setAwaitingConfirmation(true);
          setTimeout(() => router.refresh(), 2500);
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setError(
              "Payment window closed. Your registration is still saved — retry whenever you're ready.",
            );
          },
        },
      });

      checkout.open();
    } catch (caught) {
      console.error("[checkout] failed", caught);
      setError("Something went wrong starting the payment.");
    } finally {
      setBusy(false);
    }
  }, [registrationId, router]);

  if (awaitingConfirmation) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mono border border-ink bg-block-yellow px-4 py-3 text-label"
      >
        ✦ Payment received — confirming with the bank. This page will update on
        its own.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={start} disabled={disabled || busy} arrow={!busy}>
        {busy ? "Opening…" : `${label} · ${formatPaise(amount)}`}
      </Button>
      {error ? (
        <p role="alert" className="mono border border-ink bg-block-coral px-3 py-2 text-label">
          ▲ {error}
        </p>
      ) : null}
    </div>
  );
}
