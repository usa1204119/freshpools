"use client";

import { useActionState } from "react";
import {
  createRequirement,
  requestIntroduction,
  toggleShortlist,
} from "@/lib/actions/company";
import { Field, Input, Select, Textarea, Checkbox } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { FormBanner, SubmitButton, TagInput, fieldError } from "./controls";
import { COMPANY_URGENCY } from "@/lib/content";
import type { ActionState } from "@/lib/validations";

const idle: ActionState = { status: "idle" };

export function ShortlistButton({
  candidateId,
  saved,
}: {
  candidateId: string;
  saved: boolean;
}) {
  const [state, action] = useActionState(toggleShortlist, idle);

  return (
    <form action={action}>
      <input type="hidden" name="candidateId" value={candidateId} />
      <Button
        type="submit"
        size="sm"
        variant={saved ? "primary" : "secondary"}
        arrow={false}
      >
        {state.status === "success"
          ? state.message
          : saved
            ? "✓ On shortlist"
            : "Save to shortlist"}
      </Button>
    </form>
  );
}

export function RequestIntroForm({
  candidateId,
  requirements,
}: {
  candidateId: string;
  requirements: { id: string; role: string }[];
}) {
  const [state, action] = useActionState(requestIntroduction, idle);

  if (state.status === "success") {
    return (
      <div
        role="status"
        className="mono border border-ink bg-block-yellow px-4 py-3 text-label"
      >
        ✦ {state.message}
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormBanner state={state} />
      <input type="hidden" name="candidateId" value={candidateId} />

      {requirements.length > 0 ? (
        <Field label="For which role" htmlFor="requirementId">
          <Select id="requirementId" name="requirementId" defaultValue="">
            <option value="">Not tied to a specific role</option>
            {requirements.map((requirement) => (
              <option key={requirement.id} value={requirement.id}>
                {requirement.role}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      <Field
        label="Message"
        htmlFor="message"
        hint="What caught your eye? We pass this on when we ask the candidate."
      >
        <Textarea id="message" name="message" rows={3} />
      </Field>

      <SubmitButton pendingLabel="Requesting…">Request introduction</SubmitButton>

      <p className="text-[13px] text-ink-muted">
        We ask the candidate first. Their contact details are shared only after
        they agree.
      </p>
    </form>
  );
}

const STACK_SUGGESTIONS = [
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Java",
  "Go",
  "TypeScript",
  "PostgreSQL",
];

export function RequirementQuickForm() {
  const [state, action] = useActionState(createRequirement, idle);

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      <FormBanner state={state} />

      <Field label="Role title" htmlFor="role" required error={fieldError(state, "role")}>
        <Input id="role" name="role" required placeholder="Backend Engineer (Fresher)" />
      </Field>

      <Field label="Tech stack" htmlFor="stack" required error={fieldError(state, "stack")}>
        <TagInput id="stack" name="stack" suggestions={STACK_SUGGESTIONS} />
      </Field>

      <div className="grid gap-6 sm:grid-cols-3">
        <Field
          label="Openings"
          htmlFor="openings"
          required
          error={fieldError(state, "openings")}
        >
          <Input id="openings" name="openings" type="number" min={1} defaultValue={1} required />
        </Field>
        <Field
          label="CTC min (₹/yr)"
          htmlFor="ctcMin"
          required
          error={fieldError(state, "ctcMin")}
        >
          <Input id="ctcMin" name="ctcMin" type="number" min={100000} step={50000} required />
        </Field>
        <Field
          label="CTC max (₹/yr)"
          htmlFor="ctcMax"
          required
          error={fieldError(state, "ctcMax")}
        >
          <Input id="ctcMax" name="ctcMax" type="number" min={100000} step={50000} required />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Location"
          htmlFor="location"
          required
          error={fieldError(state, "location")}
        >
          <Input id="location" name="location" required />
        </Field>
        <Field label="Phone" htmlFor="phone" required error={fieldError(state, "phone")}>
          <Input id="phone" name="phone" type="tel" required />
        </Field>
      </div>

      <Checkbox id="isRemote" name="isRemote" label="Remote is fine" />

      <Field label="When do you need them" htmlFor="urgency" required>
        <Select id="urgency" name="urgency" required defaultValue="1_MONTH">
          {COMPANY_URGENCY.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" rows={3} />
      </Field>

      <SubmitButton pendingLabel="Posting…">Post requirement</SubmitButton>
    </form>
  );
}
