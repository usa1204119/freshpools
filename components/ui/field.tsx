import * as React from "react";
import { cn } from "@/lib/utils";

/* ── Shared flat-input chrome ──────────────────────────────────────────── */
const controlBase =
  "w-full border border-ink bg-block-white px-4 py-3 text-body text-ink placeholder:text-ink-muted/60 disabled:bg-paper disabled:text-ink-muted aria-[invalid=true]:bg-block-coral/30";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(controlBase, className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(controlBase, "min-h-32 resize-y", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(controlBase, className)} {...props}>
    {children}
  </select>
));
Select.displayName = "Select";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }
>(({ className, children, required, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("mono block text-label text-ink", className)}
    {...props}
  >
    {children}
    {required ? (
      <span className="text-ink-muted" aria-hidden="true">
        {" "}
        *
      </span>
    ) : null}
  </label>
));
Label.displayName = "Label";

/**
 * Wraps a control with its label, hint and error. The error is wired via
 * aria-describedby so screen readers announce it with the field.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {hint ? (
        <p id={hintId} className="text-[13px] text-ink-muted">
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p id={errorId} role="alert" className="mono text-label text-ink">
          <span aria-hidden="true">▲ </span>
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Square checkbox — no radius, ink border, ink fill when checked. */
export const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }
>(({ className, label, id, ...props }, ref) => (
  <label
    htmlFor={id}
    className="flex cursor-pointer items-start gap-3 text-body text-ink"
  >
    <input
      ref={ref}
      id={id}
      type="checkbox"
      className={cn(
        "mt-1 size-4 shrink-0 appearance-none border border-ink bg-block-white",
        "checked:bg-ink checked:bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2016%2016%22%20fill=%22none%22%3E%3Cpath%20d=%22M3%208.5L6.5%2012L13%204%22%20stroke=%22white%22%20stroke-width=%222%22/%3E%3C/svg%3E')] checked:bg-center checked:bg-no-repeat",
        className,
      )}
      {...props}
    />
    <span>{label}</span>
  </label>
));
Checkbox.displayName = "Checkbox";

/** Radio rendered as a square swatch — circles would break the system. */
export const RadioTile = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    description?: string;
  }
>(({ className, label, description, id, ...props }, ref) => (
  <label
    htmlFor={id}
    className={cn(
      "flex cursor-pointer items-start gap-3 border border-ink bg-block-white p-4",
      "has-[:checked]:bg-block-yellow",
      className,
    )}
  >
    <input
      ref={ref}
      id={id}
      type="radio"
      className="mt-1 size-4 shrink-0 appearance-none border border-ink bg-block-white checked:border-4 checked:bg-ink"
      {...props}
    />
    <span>
      <span className="block text-body font-medium">{label}</span>
      {description ? (
        <span className="block text-[13px] text-ink-muted">{description}</span>
      ) : null}
    </span>
  </label>
));
RadioTile.displayName = "RadioTile";
