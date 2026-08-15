"use client";

import { useActionState } from "react";
import { submitCollegeEnquiry } from "@/lib/actions/leads";
import { Field, Input, Select, Textarea, RadioTile } from "@/components/ui/field";
import { FormBanner, SubmitButton, fieldError } from "./controls";
import { CONTACT_ROLES } from "@/lib/content";
import type { ActionState } from "@/lib/validations";

const MONTHS = [
  "August 2026",
  "September 2026",
  "October 2026",
  "November 2026",
  "January 2027",
  "February 2027",
  "March 2027",
  "Not sure yet",
];

const initialState: ActionState = { status: "idle" };

export function CollegeEnquiryForm() {
  const [state, action] = useActionState(submitCollegeEnquiry, initialState);

  return (
    <form action={action} className="flex flex-col gap-8" noValidate>
      <FormBanner state={state} />

      <fieldset className="flex flex-col gap-6 border border-ink bg-block-white p-6 lg:p-8">
        <legend className="mono bg-block-white px-2 text-eyebrow">
          ✦ Your college
        </legend>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="College name"
            htmlFor="collegeName"
            required
            error={fieldError(state, "collegeName")}
          >
            <Input id="collegeName" name="collegeName" required autoComplete="organization" />
          </Field>

          <Field label="City" htmlFor="city" required error={fieldError(state, "city")}>
            <Input id="city" name="city" required autoComplete="address-level2" />
          </Field>

          <Field
            label="Your name"
            htmlFor="contactName"
            required
            error={fieldError(state, "contactName")}
          >
            <Input id="contactName" name="contactName" required autoComplete="name" />
          </Field>

          <Field
            label="Your role"
            htmlFor="contactRole"
            required
            error={fieldError(state, "contactRole")}
          >
            <Select id="contactRole" name="contactRole" required defaultValue="">
              <option value="" disabled>
                Select a role
              </option>
              {CONTACT_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Email" htmlFor="email" required error={fieldError(state, "email")}>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </Field>

          <Field label="Phone" htmlFor="phone" error={fieldError(state, "phone")}>
            <Input id="phone" name="phone" type="tel" autoComplete="tel" />
          </Field>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-6 border border-ink bg-block-white p-6 lg:p-8">
        <legend className="mono bg-block-white px-2 text-eyebrow">
          ✦ The engagement
        </legend>

        <div className="grid gap-6 sm:grid-cols-3">
          <Field
            label="Students expected"
            htmlFor="studentCount"
            error={fieldError(state, "studentCount")}
          >
            <Input id="studentCount" name="studentCount" type="number" min={1} placeholder="150" />
          </Field>

          <Field
            label="Department"
            htmlFor="department"
            error={fieldError(state, "department")}
          >
            <Input id="department" name="department" placeholder="CSE / IT" />
          </Field>

          <Field
            label="Preferred month"
            htmlFor="preferredMonth"
            error={fieldError(state, "preferredMonth")}
          >
            <Select id="preferredMonth" name="preferredMonth" defaultValue="">
              <option value="">No preference</option>
              {MONTHS.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="flex flex-col gap-3">
          <p className="mono text-label">
            Interested in <span className="text-ink-muted">*</span>
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { value: "HACKATHON", label: "Hackathon", description: "Sponsor-funded, free" },
              { value: "WORKSHOP", label: "Workshop", description: "Two-day paid bootcamp" },
              { value: "BOTH", label: "Both", description: "Bootcamp then event" },
            ].map((option) => (
              <RadioTile
                key={option.value}
                id={`interest-${option.value}`}
                name="interestedIn"
                value={option.value}
                label={option.label}
                description={option.description}
                defaultChecked={option.value === "BOTH"}
                required
              />
            ))}
          </div>
          {fieldError(state, "interestedIn") ? (
            <p role="alert" className="mono text-label">
              ▲ {fieldError(state, "interestedIn")}
            </p>
          ) : null}
        </div>

        <Field
          label="Anything else"
          htmlFor="message"
          hint="Facilities, exam dates to avoid, what your placement cell needs."
          error={fieldError(state, "message")}
        >
          <Textarea id="message" name="message" rows={4} />
        </Field>
      </fieldset>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SubmitButton pendingLabel="Sending…">Send enquiry</SubmitButton>
        <p className="mono text-eyebrow text-ink-muted">
          We reply within 3 working days
        </p>
      </div>
    </form>
  );
}
