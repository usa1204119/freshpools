"use client";

import { useActionState } from "react";
import { submitRequirement } from "@/lib/actions/leads";
import { Field, Input, Select, Textarea, Checkbox, RadioTile } from "@/components/ui/field";
import { FormBanner, SubmitButton, TagInput, fieldError } from "./controls";
import { COMPANY_URGENCY, SPONSOR_INTEREST } from "@/lib/content";
import type { ActionState } from "@/lib/validations";

const STACK_SUGGESTIONS = [
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Django",
  "Java",
  "Spring",
  "Go",
  "TypeScript",
  "PostgreSQL",
  "React Native",
  "Flutter",
];

const initialState: ActionState = { status: "idle" };

/**
 * Deliberately usable without a login — every extra step here costs us a lead.
 * The same Zod schema validates this payload again on the server.
 */
export function RequirementForm() {
  const [state, action] = useActionState(submitRequirement, initialState);

  return (
    <form action={action} className="flex flex-col gap-8" noValidate>
      <FormBanner state={state} />

      {/* ── Company ──────────────────────────────────────────────────────── */}
      <fieldset className="flex flex-col gap-6 border border-ink bg-block-white p-6 lg:p-8">
        <legend className="mono bg-block-white px-2 text-eyebrow">
          ✦ Your company
        </legend>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="Company name"
            htmlFor="companyName"
            required
            error={fieldError(state, "companyName")}
          >
            <Input id="companyName" name="companyName" required autoComplete="organization" />
          </Field>

          <Field label="Website" htmlFor="website" error={fieldError(state, "website")}>
            <Input
              id="website"
              name="website"
              type="url"
              placeholder="https://"
              autoComplete="url"
            />
          </Field>

          <Field
            label="Your name"
            htmlFor="contactPerson"
            required
            error={fieldError(state, "contactPerson")}
          >
            <Input id="contactPerson" name="contactPerson" required autoComplete="name" />
          </Field>

          <Field
            label="Work email"
            htmlFor="email"
            required
            error={fieldError(state, "email")}
          >
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </Field>

          <Field
            label="Phone"
            htmlFor="phone"
            required
            hint="We only call about this requirement."
            error={fieldError(state, "phone")}
          >
            <Input id="phone" name="phone" type="tel" required autoComplete="tel" />
          </Field>
        </div>
      </fieldset>

      {/* ── Role ─────────────────────────────────────────────────────────── */}
      <fieldset className="flex flex-col gap-6 border border-ink bg-block-white p-6 lg:p-8">
        <legend className="mono bg-block-white px-2 text-eyebrow">
          ✦ The role
        </legend>

        <Field
          label="Role title"
          htmlFor="role"
          required
          error={fieldError(state, "role")}
        >
          <Input
            id="role"
            name="role"
            required
            placeholder="e.g. Backend Engineer (Fresher)"
          />
        </Field>

        <Field
          label="Tech stack"
          htmlFor="stack"
          required
          hint="What will they actually work in? Press Enter after each one."
          error={fieldError(state, "stack")}
        >
          <TagInput id="stack" name="stack" suggestions={STACK_SUGGESTIONS} />
        </Field>

        <div className="grid gap-6 sm:grid-cols-3">
          <Field
            label="Openings"
            htmlFor="openings"
            required
            error={fieldError(state, "openings")}
          >
            <Input
              id="openings"
              name="openings"
              type="number"
              min={1}
              defaultValue={1}
              required
            />
          </Field>

          <Field
            label="CTC min (₹ / year)"
            htmlFor="ctcMin"
            required
            error={fieldError(state, "ctcMin")}
          >
            <Input
              id="ctcMin"
              name="ctcMin"
              type="number"
              min={100000}
              step={50000}
              placeholder="600000"
              required
            />
          </Field>

          <Field
            label="CTC max (₹ / year)"
            htmlFor="ctcMax"
            required
            error={fieldError(state, "ctcMax")}
          >
            <Input
              id="ctcMax"
              name="ctcMax"
              type="number"
              min={100000}
              step={50000}
              placeholder="900000"
              required
            />
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="Location"
            htmlFor="location"
            required
            error={fieldError(state, "location")}
          >
            <Input id="location" name="location" required placeholder="Bengaluru" />
          </Field>

          <div className="flex items-end pb-3">
            <Checkbox id="isRemote" name="isRemote" label="Remote is fine" />
          </div>
        </div>

        <Field
          label="When do you need them"
          htmlFor="urgency"
          required
          error={fieldError(state, "urgency")}
        >
          <Select id="urgency" name="urgency" required defaultValue="1_MONTH">
            {COMPANY_URGENCY.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      </fieldset>

      {/* ── Sponsorship ──────────────────────────────────────────────────── */}
      <fieldset className="flex flex-col gap-4 border border-ink bg-block-white p-6 lg:p-8">
        <legend className="mono bg-block-white px-2 text-eyebrow">
          ✦ Sponsorship
        </legend>
        <p className="text-[15px] text-ink-muted">
          Would you sponsor an event built around this problem? Sponsored events
          make entry free for students, and you watch candidates solve something
          that looks like your real work.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {SPONSOR_INTEREST.map((option, index) => (
            <RadioTile
              key={option.value}
              id={`sponsor-${option.value}`}
              name="sponsorInterest"
              value={option.value}
              label={option.label}
              description={option.description}
              defaultChecked={index === 1}
              required
            />
          ))}
        </div>
      </fieldset>

      <Field
        label="Anything else"
        htmlFor="notes"
        hint="Team size, what a great first six months looks like, hard constraints."
        error={fieldError(state, "notes")}
      >
        <Textarea id="notes" name="notes" rows={4} />
      </Field>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SubmitButton pendingLabel="Sending…">Send requirement</SubmitButton>
        <p className="mono text-eyebrow text-ink-muted">
          No account needed · Reply within 7 days
        </p>
      </div>
    </form>
  );
}
