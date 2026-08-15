"use client";

import { useActionState } from "react";
import { saveSubmission } from "@/lib/actions/submission";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { FormBanner, TagInput, fieldError } from "./controls";
import type { ActionState } from "@/lib/validations";

const idle: ActionState = { status: "idle" };

const STACK_SUGGESTIONS = [
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "FastAPI",
  "PostgreSQL",
  "Flutter",
  "Firebase",
];

export function SubmissionForm({
  teamId,
  locked,
  defaults = {},
}: {
  teamId: string;
  /** Deadline passed or already submitted — the server enforces this too. */
  locked: boolean;
  defaults?: {
    title?: string;
    description?: string;
    repoUrl?: string;
    videoUrl?: string;
    stack?: string[];
    contributions?: string;
  };
}) {
  const [state, action] = useActionState(saveSubmission, idle);

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      <FormBanner state={state} />
      <input type="hidden" name="teamId" value={teamId} />

      <fieldset disabled={locked} className="flex flex-col gap-6">
        <Field
          label="Project title"
          htmlFor="title"
          required
          error={fieldError(state, "title")}
        >
          <Input id="title" name="title" required defaultValue={defaults.title} />
        </Field>

        <Field
          label="What you built"
          htmlFor="description"
          required
          hint="What it does, who it's for, what works and what doesn't."
          error={fieldError(state, "description")}
        >
          <Textarea
            id="description"
            name="description"
            rows={6}
            required
            defaultValue={defaults.description}
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="Repository URL"
            htmlFor="repoUrl"
            required
            hint="Must be public through judging."
            error={fieldError(state, "repoUrl")}
          >
            <Input
              id="repoUrl"
              name="repoUrl"
              type="url"
              required
              placeholder="https://github.com/team/project"
              defaultValue={defaults.repoUrl}
            />
          </Field>

          <Field
            label="Demo video URL"
            htmlFor="videoUrl"
            required
            hint="Screen recording of it running. Mandatory."
            error={fieldError(state, "videoUrl")}
          >
            <Input
              id="videoUrl"
              name="videoUrl"
              type="url"
              required
              defaultValue={defaults.videoUrl}
            />
          </Field>
        </div>

        <Field label="Stack" htmlFor="stack" required error={fieldError(state, "stack")}>
          <TagInput
            id="stack"
            name="stack"
            initial={defaults.stack ?? []}
            suggestions={STACK_SUGGESTIONS}
          />
        </Field>

        <Field
          label="Who built what"
          htmlFor="contributions"
          required
          hint="Name by name. We read this during the viva, and scoring is per person — not per team."
          error={fieldError(state, "contributions")}
        >
          <Textarea
            id="contributions"
            name="contributions"
            rows={5}
            required
            placeholder={"Aditi — auth, database schema\nRohan — the matching algorithm, tests\n…"}
            defaultValue={defaults.contributions}
          />
        </Field>
      </fieldset>

      {locked ? (
        <p className="mono border border-ink bg-block-blue px-4 py-3 text-label">
          ✦ This submission is locked.
        </p>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Button type="submit" name="intent" value="draft" variant="secondary">
            Save draft
          </Button>
          <Button type="submit" name="intent" value="submit">
            Submit and lock
          </Button>
          <p className="mono text-eyebrow text-ink-muted">
            Submitting is final
          </p>
        </div>
      )}
    </form>
  );
}
