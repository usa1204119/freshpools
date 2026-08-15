"use client";

import { useActionState } from "react";
import { respondToIntro } from "@/lib/actions/intro";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/validations";

const idle: ActionState = { status: "idle" };

/**
 * Consent gate. Nothing identifying reaches the company until the candidate
 * presses "Share my details".
 */
export function IntroResponseButtons({ introId }: { introId: string }) {
  const [state, action] = useActionState(respondToIntro, idle);

  if (state.status === "success") {
    return (
      <p role="status" className="mono text-eyebrow">
        ✓ {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="introId" value={introId} />
      {state.status === "error" ? (
        <p role="alert" className="mono text-eyebrow">
          ▲ {state.message}
        </p>
      ) : null}
      <Button
        type="submit"
        name="decision"
        value="accept"
        size="sm"
        className="w-full"
      >
        Share my details
      </Button>
      <Button
        type="submit"
        name="decision"
        value="decline"
        size="sm"
        variant="secondary"
        arrow={false}
        className="w-full"
      >
        Not interested
      </Button>
    </form>
  );
}
