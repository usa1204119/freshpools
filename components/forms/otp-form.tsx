"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { requestOtpAction, verifyOtpAction } from "@/lib/actions/auth";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { FormBanner, SubmitButton, fieldError } from "./controls";
import { OTP_LENGTH } from "@/lib/otp-constants";
import type { ActionState } from "@/lib/validations";

const idle: ActionState = { status: "idle" };

/**
 * Two-step email OTP. Step one requests a code, step two exchanges it for a
 * session. The email is carried forward in a hidden field so the second step
 * cannot be pointed at a different address than the one that was verified.
 */
export function OtpForm({
  intendedRole = "CANDIDATE",
  next,
  askName = false,
}: {
  intendedRole?: "CANDIDATE" | "COMPANY";
  next?: string;
  /** Signup collects a name up front; login does not. */
  askName?: boolean;
}) {
  const [requestState, requestAction] = useActionState(requestOtpAction, idle);
  const [verifyState, verifyAction] = useActionState(verifyOtpAction, idle);

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (requestState.status === "success") {
      setStep("code");
      // Move focus to the code field so the flow continues without a click.
      requestAnimationFrame(() => codeRef.current?.focus());
    }
  }, [requestState]);

  if (step === "email") {
    return (
      <form action={requestAction} className="flex flex-col gap-6" noValidate>
        <FormBanner state={requestState} />

        <input type="hidden" name="intendedRole" value={intendedRole} />

        {askName ? (
          <Field
            label="Your name"
            htmlFor="name"
            required
            error={fieldError(requestState, "name")}
          >
            <Input
              id="name"
              name="name"
              required
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
        ) : null}

        <Field
          label="Email address"
          htmlFor="email"
          required
          hint="We'll send a 6-digit code. No password to remember."
          error={fieldError(requestState, "email")}
        >
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        <SubmitButton pendingLabel="Sending code…">Send code</SubmitButton>
      </form>
    );
  }

  return (
    <form action={verifyAction} className="flex flex-col gap-6" noValidate>
      <FormBanner state={verifyState.status === "idle" ? requestState : verifyState} />

      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="intendedRole" value={intendedRole} />
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <Field
        label={`Code sent to ${email}`}
        htmlFor="code"
        required
        hint={`${OTP_LENGTH} digits. Check spam if it hasn't arrived.`}
        error={fieldError(verifyState, "code")}
      >
        <Input
          ref={codeRef}
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={OTP_LENGTH}
          required
          placeholder="000000"
          className="mono text-center text-[28px] tracking-[0.4em]"
        />
      </Field>

      <SubmitButton pendingLabel="Verifying…">Verify and continue</SubmitButton>

      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="button"
          variant="link"
          arrow={false}
          onClick={() => setStep("email")}
        >
          Use a different email
        </Button>
        <span aria-hidden="true" className="text-ink-muted">
          ·
        </span>
        <button
          type="submit"
          formAction={requestAction}
          formNoValidate
          className="mono text-label underline underline-offset-4"
        >
          Resend code
        </button>
      </div>
    </form>
  );
}
