"use client";

import { useActionState, useState } from "react";
import {
  createTeam,
  joinTeam,
  leaveTeam,
  registerForEvent,
  withdrawFromEvent,
} from "@/lib/actions/registration";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { FormBanner, SubmitButton, TagInput, fieldError } from "./controls";
import { TSHIRT_SIZES } from "@/lib/content";
import type { ActionState } from "@/lib/validations";

const idle: ActionState = { status: "idle" };

const SKILL_SUGGESTIONS = [
  "React",
  "Node.js",
  "Python",
  "Java",
  "TypeScript",
  "Flutter",
  "PostgreSQL",
  "Figma",
];

export function RegistrationDetailsForm({
  eventSlug,
  defaults,
}: {
  eventSlug: string;
  defaults: {
    college?: string;
    gradYear?: number;
    phone?: string;
    github?: string;
    skills?: string[];
  };
}) {
  const [state, action] = useActionState(registerForEvent, idle);
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 9 }, (_, i) => thisYear - 3 + i);

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      <FormBanner state={state} />
      <input type="hidden" name="eventSlug" value={eventSlug} />

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="College" htmlFor="college" required error={fieldError(state, "college")}>
          <Input id="college" name="college" required defaultValue={defaults.college} />
        </Field>

        <Field
          label="Graduation year"
          htmlFor="gradYear"
          required
          error={fieldError(state, "gradYear")}
        >
          <Select
            id="gradYear"
            name="gradYear"
            required
            defaultValue={defaults.gradYear ?? thisYear + 1}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Phone" htmlFor="phone" required error={fieldError(state, "phone")}>
          <Input
            id="phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            defaultValue={defaults.phone}
          />
        </Field>

        <Field
          label="T-shirt size"
          htmlFor="tshirtSize"
          required
          error={fieldError(state, "tshirtSize")}
        >
          <Select id="tshirtSize" name="tshirtSize" required defaultValue="M">
            {TSHIRT_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="GitHub profile"
        htmlFor="github"
        required
        hint="We read commit history during judging."
        error={fieldError(state, "github")}
      >
        <Input
          id="github"
          name="github"
          type="url"
          required
          placeholder="https://github.com/yourname"
          defaultValue={defaults.github}
        />
      </Field>

      <Field
        label="Skills"
        htmlFor="skills"
        required
        error={fieldError(state, "skills")}
      >
        <TagInput
          id="skills"
          name="skills"
          initial={defaults.skills ?? []}
          suggestions={SKILL_SUGGESTIONS}
        />
      </Field>

      <SubmitButton pendingLabel="Saving…">Save and continue</SubmitButton>
    </form>
  );
}

export function TeamForms({ eventSlug }: { eventSlug: string }) {
  const [createState, createAction] = useActionState(createTeam, idle);
  const [joinState, joinAction] = useActionState(joinTeam, idle);

  return (
    <div className="grid gap-px border border-ink bg-ink lg:grid-cols-2">
      <div className="flex flex-col gap-5 bg-block-white p-6 lg:p-8">
        <div>
          <p className="mono text-eyebrow text-ink-muted">Option A</p>
          <h3 className="mt-2 font-sans text-[22px] font-bold tracking-[-0.02em]">
            Create a team
          </h3>
          <p className="mt-2 text-[15px] text-ink-muted">
            You get a join code to share with the people you want on it.
          </p>
        </div>

        <form action={createAction} className="flex flex-col gap-4" noValidate>
          <FormBanner state={createState} />
          <input type="hidden" name="eventSlug" value={eventSlug} />
          <Field
            label="Team name"
            htmlFor="teamName"
            required
            error={fieldError(createState, "name")}
          >
            <Input id="teamName" name="name" required maxLength={40} />
          </Field>
          <SubmitButton pendingLabel="Creating…">Create team</SubmitButton>
        </form>
      </div>

      <div className="flex flex-col gap-5 bg-block-blue p-6 lg:p-8">
        <div>
          <p className="mono text-eyebrow text-ink-muted">Option B</p>
          <h3 className="mt-2 font-sans text-[22px] font-bold tracking-[-0.02em]">
            Join with a code
          </h3>
          <p className="mt-2 text-[15px] text-ink-muted">
            Someone already made the team? Paste their six-character code.
          </p>
        </div>

        <form action={joinAction} className="flex flex-col gap-4" noValidate>
          <FormBanner state={joinState} />
          <input type="hidden" name="eventSlug" value={eventSlug} />
          <Field
            label="Join code"
            htmlFor="joinCode"
            required
            error={fieldError(joinState, "joinCode")}
          >
            <Input
              id="joinCode"
              name="joinCode"
              required
              maxLength={6}
              placeholder="AB3K9Z"
              className="mono text-center text-[22px] tracking-[0.3em] uppercase"
            />
          </Field>
          <SubmitButton pendingLabel="Joining…">Join team</SubmitButton>
        </form>
      </div>
    </div>
  );
}

/**
 * Two-step, and honest about the money: a paid withdrawal is flagged for an
 * organiser rather than silently refunded, so the button must not imply the
 * money comes straight back.
 */
export function WithdrawButton({
  registrationId,
  isPaid,
  eventTitle,
}: {
  registrationId: string;
  isPaid: boolean;
  eventTitle: string;
}) {
  const [state, action] = useActionState(withdrawFromEvent, idle);
  const [confirming, setConfirming] = useState(false);

  if (state.status === "success") {
    return (
      <p role="status" className="mono max-w-56 text-eyebrow">
        ✓ {state.message}
      </p>
    );
  }

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="link"
        arrow={false}
        onClick={() => setConfirming(true)}
      >
        Withdraw
      </Button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3 border border-ink bg-block-coral p-4">
      <input type="hidden" name="registrationId" value={registrationId} />
      <p className="max-w-64 text-[13px]">
        Withdraw from {eventTitle}?{" "}
        {isPaid
          ? "You've already paid, so this is sent to an organiser for a refund decision — it is not automatic."
          : "Nothing has been charged, so there's nothing to refund."}{" "}
        You&apos;ll also leave your team.
      </p>
      {state.status === "error" ? (
        <p role="alert" className="mono max-w-64 text-eyebrow">
          ▲ {state.message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <SubmitButton pendingLabel="Withdrawing…">Yes, withdraw</SubmitButton>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          arrow={false}
          onClick={() => setConfirming(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function LeaveTeamButton({
  teamId,
  eventSlug,
}: {
  teamId: string;
  eventSlug: string;
}) {
  const [state, action] = useActionState(leaveTeam, idle);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="eventSlug" value={eventSlug} />
      {state.status === "error" ? (
        <p role="alert" className="mono border border-ink bg-block-coral px-3 py-2 text-label">
          ▲ {state.message}
        </p>
      ) : null}
      <Button type="submit" variant="link" arrow={false} className="self-start">
        Leave this team
      </Button>
    </form>
  );
}
