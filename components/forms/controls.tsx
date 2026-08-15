"use client";

import { useState, type KeyboardEvent } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/lib/validations";

/** Disabled + relabelled while the server action is in flight. */
export function SubmitButton({
  children,
  pendingLabel = "Sending…",
  className,
  variant,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  variant?: "primary" | "secondary" | "inverse";
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      disabled={pending}
      arrow={!pending}
      className={className}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}

/** Form-level error banner. Field-level errors render next to their input. */
export function FormBanner({ state }: { state: ActionState }) {
  if (state.status === "idle") return null;

  const isError = state.status === "error";
  const message = isError ? state.message : (state.message ?? "Done.");

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "mono border border-ink px-4 py-3 text-label",
        isError ? "bg-block-coral" : "bg-block-yellow",
      )}
    >
      <span aria-hidden="true">{isError ? "▲ " : "✦ "}</span>
      {message}
    </div>
  );
}

/**
 * Chip input for skills / stack. Values are submitted as repeated hidden
 * inputs so the server action reads them with `formData.getAll(name)`.
 */
export function TagInput({
  name,
  id,
  placeholder = "Type and press Enter",
  initial = [],
  max = 12,
  suggestions = [],
}: {
  name: string;
  id: string;
  placeholder?: string;
  initial?: string[];
  max?: number;
  suggestions?: string[];
}) {
  const [tags, setTags] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const value = raw.trim().replace(/,$/, "");
    if (!value) return;
    if (tags.length >= max) return;
    if (tags.some((t) => t.toLowerCase() === value.toLowerCase())) return;
    setTags([...tags, value]);
    setDraft("");
  };

  const remove = (value: string) =>
    setTags(tags.filter((tag) => tag !== value));

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add(draft);
    } else if (event.key === "Backspace" && draft === "" && tags.length > 0) {
      remove(tags[tags.length - 1]);
    }
  };

  const remaining = suggestions.filter(
    (s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-3">
      {tags.map((tag) => (
        <input key={tag} type="hidden" name={name} value={tag} />
      ))}

      {tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag}>
              <button
                type="button"
                onClick={() => remove(tag)}
                className="mono flex items-center gap-2 border border-ink bg-block-yellow px-2 py-1 text-eyebrow"
                aria-label={`Remove ${tag}`}
              >
                {tag}
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          placeholder={tags.length >= max ? `Maximum ${max} reached` : placeholder}
          disabled={tags.length >= max}
          aria-describedby={`${id}-hint`}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          arrow={false}
          onClick={() => add(draft)}
          disabled={tags.length >= max}
          className="shrink-0"
        >
          Add
        </Button>
      </div>

      {remaining.length > 0 && tags.length < max ? (
        <ul className="flex flex-wrap gap-2">
          {remaining.slice(0, 8).map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onClick={() => add(suggestion)}
                className="mono border border-ink border-dashed px-2 py-1 text-eyebrow text-ink-muted hover:border-solid hover:text-ink"
              >
                + {suggestion}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <p id={`${id}-hint`} className="sr-only">
        Press Enter to add each item. Up to {max}.
      </p>
    </div>
  );
}

/** First error string for a field, if the action returned any. */
export function fieldError(
  state: ActionState,
  field: string,
): string | undefined {
  if (state.status !== "error") return undefined;
  return state.fieldErrors?.[field]?.[0];
}
