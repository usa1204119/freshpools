"use client";

import { useState } from "react";
import { generateUploadDropzone } from "@uploadthing/react";
import type { AppFileRouter } from "@/lib/uploadthing";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";

const UploadDropzone = generateUploadDropzone<AppFileRouter>();

/**
 * Upload with a URL fallback.
 *
 * Two reasons the URL field never goes away: uploads are optional
 * infrastructure (no token → no uploader), and plenty of candidates already
 * host their demo on YouTube or Loom, which is a better outcome than a 64MB
 * file in our bucket.
 */
export function FileUploadField({
  endpoint,
  name,
  id,
  label,
  hint,
  defaultValue,
  enabled,
  accept,
}: {
  endpoint: "resume" | "demoVideo";
  name: string;
  id: string;
  label: string;
  hint?: string;
  defaultValue?: string;
  /** False when UPLOADTHING_TOKEN is unset — renders the URL field only. */
  enabled: boolean;
  accept: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [mode, setMode] = useState<"link" | "upload">("link");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label htmlFor={id} className="mono text-label text-ink">
          {label}
        </label>

        {enabled ? (
          <div role="group" aria-label={`${label} input method`} className="flex border border-ink">
            {(["link", "upload"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={mode === option}
                onClick={() => setMode(option)}
                className={cn(
                  "mono border-r border-ink px-3 py-1.5 text-eyebrow last:border-r-0",
                  mode === option ? "bg-ink text-white" : "bg-block-white text-ink",
                )}
              >
                {option === "link" ? "Paste link" : "Upload"}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {hint ? <p className="text-[13px] text-ink-muted">{hint}</p> : null}

      {/* The form always submits this field, whichever method filled it. */}
      <Input
        id={id}
        name={name}
        type="url"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="https://"
        className={mode === "upload" && enabled ? "sr-only" : undefined}
        aria-hidden={mode === "upload" && enabled ? true : undefined}
        tabIndex={mode === "upload" && enabled ? -1 : undefined}
      />

      {enabled && mode === "upload" ? (
        <>
          <UploadDropzone
            endpoint={endpoint}
            onUploadBegin={() => {
              setUploading(true);
              setError(null);
            }}
            onClientUploadComplete={(files) => {
              setUploading(false);
              const uploaded = files?.[0]?.ufsUrl;
              if (uploaded) {
                setUrl(uploaded);
                // Back to link view so the saved URL is visible and editable.
                setMode("link");
              }
            }}
            onUploadError={(uploadError: Error) => {
              setUploading(false);
              setError(uploadError.message);
            }}
            config={{ cn }}
            appearance={{
              // Square, ink-bordered, no radius — matching the design system.
              container:
                "border border-ink border-dashed bg-block-white p-6 ut-uploading:bg-block-yellow",
              uploadIcon: "text-ink",
              label: "text-ink font-sans text-[15px] hover:text-ink",
              allowedContent: "mono text-eyebrow text-ink-muted",
              button:
                "bg-ink text-white px-5 py-3 text-[14px] font-medium after:bg-block-yellow ut-ready:bg-ink ut-uploading:bg-ink-muted",
            }}
          />
          <p className="mono text-eyebrow text-ink-muted">
            Accepts {accept}. Saved to your profile as soon as the upload finishes.
          </p>
        </>
      ) : null}

      {uploading ? (
        <p role="status" className="mono text-eyebrow">
          Uploading…
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mono border border-ink bg-block-coral px-3 py-2 text-label">
          ▲ {error}
        </p>
      ) : null}
    </div>
  );
}
