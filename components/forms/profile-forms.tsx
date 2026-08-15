"use client";

import { useActionState } from "react";
import { saveCandidateProfile, saveCompanyProfile } from "@/lib/actions/profile";
import { Field, Input, Select } from "@/components/ui/field";
import { FormBanner, SubmitButton, TagInput, fieldError } from "./controls";
import { FileUploadField } from "./file-upload";
import type { ActionState } from "@/lib/validations";

const idle: ActionState = { status: "idle" };

const SKILL_SUGGESTIONS = [
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Java",
  "C++",
  "TypeScript",
  "PostgreSQL",
  "Flutter",
  "Django",
  "Docker",
  "Figma",
];

export type CandidateDefaults = {
  name?: string;
  phone?: string;
  college?: string;
  gradYear?: number;
  github?: string;
  linkedin?: string;
  skills?: string[];
  resumeUrl?: string;
  videoUrl?: string;
  availability?: "LOOKING" | "OPEN" | "PLACED";
};

export function CandidateProfileForm({
  defaults = {},
  mode = "edit",
  next,
  uploadsEnabled = false,
}: {
  defaults?: CandidateDefaults;
  mode?: "edit" | "onboarding";
  next?: string;
  /** Server tells us whether UPLOADTHING_TOKEN exists; false → URL fields only. */
  uploadsEnabled?: boolean;
}) {
  const [state, action] = useActionState(saveCandidateProfile, idle);
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 9 }, (_, i) => thisYear - 3 + i);

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      <FormBanner state={state} />
      <input type="hidden" name="mode" value={mode} />
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Full name" htmlFor="name" required error={fieldError(state, "name")}>
          <Input
            id="name"
            name="name"
            required
            autoComplete="name"
            defaultValue={defaults.name}
          />
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
          label="College"
          htmlFor="college"
          required
          error={fieldError(state, "college")}
        >
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
      </div>

      <Field
        label="GitHub profile"
        htmlFor="github"
        required
        hint="We read commit history — this is not decorative."
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

      <Field label="LinkedIn" htmlFor="linkedin" error={fieldError(state, "linkedin")}>
        <Input
          id="linkedin"
          name="linkedin"
          type="url"
          placeholder="https://linkedin.com/in/you"
          defaultValue={defaults.linkedin}
        />
      </Field>

      <Field
        label="Skills"
        htmlFor="skills"
        required
        hint="Only what you'd defend in a viva."
        error={fieldError(state, "skills")}
      >
        <TagInput
          id="skills"
          name="skills"
          initial={defaults.skills ?? []}
          suggestions={SKILL_SUGGESTIONS}
        />
      </Field>

      {mode === "edit" ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2">
            <FileUploadField
              endpoint="resume"
              id="resumeUrl"
              name="resumeUrl"
              label="Resume"
              hint="A public link — Drive, Dropbox, your own site — or upload a PDF."
              defaultValue={defaults.resumeUrl}
              enabled={uploadsEnabled}
              accept="PDF up to 4MB"
            />

            <FileUploadField
              endpoint="demoVideo"
              id="videoUrl"
              name="videoUrl"
              label="Demo video"
              hint="Your strongest recorded walkthrough. A YouTube or Loom link is ideal."
              defaultValue={defaults.videoUrl}
              enabled={uploadsEnabled}
              accept="video up to 64MB"
            />
          </div>
          {fieldError(state, "resumeUrl") || fieldError(state, "videoUrl") ? (
            <p role="alert" className="mono text-label">
              ▲ {fieldError(state, "resumeUrl") ?? fieldError(state, "videoUrl")}
            </p>
          ) : null}

          <Field
            label="Availability"
            htmlFor="availability"
            error={fieldError(state, "availability")}
          >
            <Select
              id="availability"
              name="availability"
              defaultValue={defaults.availability ?? "LOOKING"}
            >
              <option value="LOOKING">Actively looking</option>
              <option value="OPEN">Open to the right thing</option>
              <option value="PLACED">Placed — not looking</option>
            </Select>
          </Field>
        </>
      ) : (
        <>
          <input type="hidden" name="resumeUrl" value={defaults.resumeUrl ?? ""} />
          <input type="hidden" name="videoUrl" value={defaults.videoUrl ?? ""} />
          <input type="hidden" name="availability" value="LOOKING" />
        </>
      )}

      <SubmitButton pendingLabel="Saving…">
        {mode === "onboarding" ? "Finish setup" : "Save profile"}
      </SubmitButton>
    </form>
  );
}

export function CompanyProfileForm({
  defaults = {},
  mode = "edit",
}: {
  defaults?: {
    companyName?: string;
    website?: string;
    contactPerson?: string;
    phone?: string;
  };
  mode?: "edit" | "onboarding";
}) {
  const [state, action] = useActionState(saveCompanyProfile, idle);

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      <FormBanner state={state} />
      <input type="hidden" name="mode" value={mode} />

      <Field
        label="Company name"
        htmlFor="companyName"
        required
        error={fieldError(state, "companyName")}
      >
        <Input
          id="companyName"
          name="companyName"
          required
          autoComplete="organization"
          defaultValue={defaults.companyName}
        />
      </Field>

      <Field label="Website" htmlFor="website" error={fieldError(state, "website")}>
        <Input
          id="website"
          name="website"
          type="url"
          placeholder="https://"
          defaultValue={defaults.website}
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Your name"
          htmlFor="contactPerson"
          required
          error={fieldError(state, "contactPerson")}
        >
          <Input
            id="contactPerson"
            name="contactPerson"
            required
            autoComplete="name"
            defaultValue={defaults.contactPerson}
          />
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
      </div>

      <SubmitButton pendingLabel="Saving…">
        {mode === "onboarding" ? "Finish setup" : "Save details"}
      </SubmitButton>
    </form>
  );
}
