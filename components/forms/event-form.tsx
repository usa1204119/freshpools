"use client";

import { useActionState, useState } from "react";
import { saveEvent, addPrize, deletePrize, updateEventStatus } from "@/lib/actions/event";
import { Field, Input, Select, Textarea, Checkbox } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { FormBanner, SubmitButton, TagInput, fieldError } from "./controls";
import { formatPaise } from "@/lib/utils";
import type { ActionState } from "@/lib/validations";

const idle: ActionState = { status: "idle" };

const STATUSES = [
  ["DRAFT", "Draft — invisible to the public"],
  ["ANNOUNCED", "Announced — page live, registration not open"],
  ["REGISTRATION_OPEN", "Registration open"],
  ["REGISTRATION_CLOSED", "Registration closed"],
  ["LIVE", "Live — event running"],
  ["JUDGING", "Judging"],
  ["COMPLETED", "Completed — leaderboard public"],
  ["CANCELLED", "Cancelled"],
] as const;

export type EventDefaults = {
  id?: string;
  title?: string;
  slug?: string;
  tagline?: string;
  problemStatement?: string;
  mode?: "ONLINE" | "OFFLINE";
  venue?: string;
  city?: string;
  collegeId?: string;
  sponsorId?: string;
  /** Pre-formatted "YYYY-MM-DDTHH:mm" in IST — see toIstInput() below. */
  startAt?: string;
  endAt?: string;
  deadline?: string;
  status?: string;
  prizePool?: number;
  minTeamSize?: number;
  maxTeamSize?: number;
  tracks?: string[];
  rules?: string[];
  registrationFee?: number;
  depositAmount?: number;
  isSponsoredFree?: boolean;
  coverBlock?: string;
};

export function EventForm({
  defaults = {},
  colleges,
  companies,
}: {
  defaults?: EventDefaults;
  colleges: { id: string; name: string }[];
  companies: { id: string; name: string }[];
}) {
  const [state, action] = useActionState(saveEvent, idle);
  const [mode, setMode] = useState(defaults.mode ?? "OFFLINE");
  const [sponsoredFree, setSponsoredFree] = useState(defaults.isSponsoredFree ?? false);

  // Money is stored in paise but typed in rupees.
  const feeRupees = (defaults.registrationFee ?? 20000) / 100;
  const depositRupees = (defaults.depositAmount ?? 10000) / 100;
  const prizePoolRupees = defaults.prizePool ? defaults.prizePool / 100 : "";

  return (
    <form action={action} className="flex flex-col gap-8" noValidate>
      <FormBanner state={state} />
      {defaults.id ? <input type="hidden" name="id" value={defaults.id} /> : null}

      {/* ── Identity ───────────────────────────────────────────────────── */}
      <fieldset className="flex flex-col gap-6 border border-ink bg-block-white p-6">
        <legend className="mono bg-block-white px-2 text-eyebrow">✦ The event</legend>

        <Field label="Title" htmlFor="title" required error={fieldError(state, "title")}>
          <Input id="title" name="title" required defaultValue={defaults.title} />
        </Field>

        <Field
          label="URL slug"
          htmlFor="slug"
          hint="Leave blank to derive it from the title. This is the public URL — changing it later breaks shared links."
          error={fieldError(state, "slug")}
        >
          <Input
            id="slug"
            name="slug"
            defaultValue={defaults.slug}
            placeholder="build-sprint-monsoon"
            className="mono"
          />
        </Field>

        <Field
          label="Tagline"
          htmlFor="tagline"
          hint="One line, shown under the title."
          error={fieldError(state, "tagline")}
        >
          <Input id="tagline" name="tagline" defaultValue={defaults.tagline} />
        </Field>

        <Field
          label="Problem statement"
          htmlFor="problemStatement"
          required
          hint="This is what people build against. Line breaks are preserved on the public page."
          error={fieldError(state, "problemStatement")}
        >
          <Textarea
            id="problemStatement"
            name="problemStatement"
            rows={12}
            required
            defaultValue={defaults.problemStatement}
          />
        </Field>

        <Field label="Tracks" htmlFor="tracks" hint="Optional. Leave empty for a single-track event.">
          <TagInput id="tracks" name="tracks" initial={defaults.tracks ?? []} max={8} />
        </Field>

        <Field
          label="Rules"
          htmlFor="rules"
          hint="Leave empty to use the standard rule set."
        >
          <TagInput
            id="rules"
            name="rules"
            initial={defaults.rules ?? []}
            max={15}
            placeholder="One rule per entry"
          />
        </Field>
      </fieldset>

      {/* ── Where & when ───────────────────────────────────────────────── */}
      <fieldset className="flex flex-col gap-6 border border-ink bg-block-white p-6">
        <legend className="mono bg-block-white px-2 text-eyebrow">✦ Where and when</legend>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Mode" htmlFor="mode" required>
            <Select
              id="mode"
              name="mode"
              required
              value={mode}
              onChange={(event) => setMode(event.target.value as "ONLINE" | "OFFLINE")}
            >
              <option value="OFFLINE">Offline</option>
              <option value="ONLINE">Online</option>
            </Select>
          </Field>

          <Field label="Host college" htmlFor="collegeId" hint="Optional.">
            <Select id="collegeId" name="collegeId" defaultValue={defaults.collegeId ?? ""}>
              <option value="">No host college</option>
              {colleges.map((college) => (
                <option key={college.id} value={college.id}>
                  {college.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {mode === "OFFLINE" ? (
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Venue" htmlFor="venue" error={fieldError(state, "venue")}>
              <Input id="venue" name="venue" defaultValue={defaults.venue} />
            </Field>
            <Field label="City" htmlFor="city" error={fieldError(state, "city")}>
              <Input id="city" name="city" defaultValue={defaults.city} />
            </Field>
          </div>
        ) : (
          <>
            <input type="hidden" name="venue" value="" />
            <input type="hidden" name="city" value="" />
          </>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <Field
            label="Registration closes"
            htmlFor="deadline"
            required
            hint="IST"
            error={fieldError(state, "deadline")}
          >
            <Input
              id="deadline"
              name="deadline"
              type="datetime-local"
              required
              defaultValue={defaults.deadline}
            />
          </Field>
          <Field
            label="Kickoff"
            htmlFor="startAt"
            required
            hint="IST"
            error={fieldError(state, "startAt")}
          >
            <Input
              id="startAt"
              name="startAt"
              type="datetime-local"
              required
              defaultValue={defaults.startAt}
            />
          </Field>
          <Field
            label="Submissions close"
            htmlFor="endAt"
            required
            hint="IST — this is the hard submission lock"
            error={fieldError(state, "endAt")}
          >
            <Input
              id="endAt"
              name="endAt"
              type="datetime-local"
              required
              defaultValue={defaults.endAt}
            />
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="Minimum team size"
            htmlFor="minTeamSize"
            required
            error={fieldError(state, "minTeamSize")}
          >
            <Input
              id="minTeamSize"
              name="minTeamSize"
              type="number"
              min={1}
              max={10}
              required
              defaultValue={defaults.minTeamSize ?? 2}
            />
          </Field>
          <Field
            label="Maximum team size"
            htmlFor="maxTeamSize"
            required
            error={fieldError(state, "maxTeamSize")}
          >
            <Input
              id="maxTeamSize"
              name="maxTeamSize"
              type="number"
              min={1}
              max={10}
              required
              defaultValue={defaults.maxTeamSize ?? 4}
            />
          </Field>
        </div>
      </fieldset>

      {/* ── Money ──────────────────────────────────────────────────────── */}
      <fieldset className="flex flex-col gap-6 border border-ink bg-block-white p-6">
        <legend className="mono bg-block-white px-2 text-eyebrow">✦ Money</legend>
        <p className="text-[14px] text-ink-muted">
          Enter rupees — stored as paise. The deposit is the part refunded after a
          verified check-in, and it cannot exceed the entry fee.
        </p>

        <div className="grid gap-6 sm:grid-cols-3">
          <Field
            label="Entry fee (₹)"
            htmlFor="registrationFee"
            required
            error={fieldError(state, "registrationFee")}
          >
            <Input
              id="registrationFee"
              name="registrationFee"
              type="number"
              min={0}
              required
              defaultValue={feeRupees}
            />
          </Field>
          <Field
            label="Refundable deposit (₹)"
            htmlFor="depositAmount"
            required
            error={fieldError(state, "depositAmount")}
          >
            <Input
              id="depositAmount"
              name="depositAmount"
              type="number"
              min={0}
              required
              defaultValue={depositRupees}
            />
          </Field>
          <Field
            label="Prize pool (₹)"
            htmlFor="prizePool"
            error={fieldError(state, "prizePool")}
          >
            <Input
              id="prizePool"
              name="prizePool"
              type="number"
              min={0}
              defaultValue={prizePoolRupees}
            />
          </Field>
        </div>

        <Field label="Sponsor" htmlFor="sponsorId" error={fieldError(state, "sponsorId")}>
          <Select id="sponsorId" name="sponsorId" defaultValue={defaults.sponsorId ?? ""}>
            <option value="">No sponsor</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="border border-ink bg-block-yellow p-4">
          <Checkbox
            id="isSponsoredFree"
            name="isSponsoredFree"
            label="Entry is free — sponsor covers it"
            checked={sponsoredFree}
            onChange={(event) => setSponsoredFree(event.target.checked)}
          />
          <p className="mt-3 text-[13px]">
            Registrations are created as WAIVED and nothing is charged. If people
            have <em>already</em> paid, use &ldquo;Refund everyone in full&rdquo; on the
            registrations page after saving.
          </p>
        </div>
      </fieldset>

      {/* ── Publish ────────────────────────────────────────────────────── */}
      <fieldset className="flex flex-col gap-6 border border-ink bg-block-white p-6">
        <legend className="mono bg-block-white px-2 text-eyebrow">✦ Publishing</legend>

        <Field label="Status" htmlFor="status" required>
          <Select id="status" name="status" required defaultValue={defaults.status ?? "DRAFT"}>
            {STATUSES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Card colour" htmlFor="coverBlock">
          <Select id="coverBlock" name="coverBlock" defaultValue={defaults.coverBlock ?? "blue"}>
            <option value="blue">Blue</option>
            <option value="coral">Coral</option>
            <option value="yellow">Yellow</option>
            <option value="white">White</option>
          </Select>
        </Field>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pendingLabel="Saving…">
          {defaults.id ? "Save changes" : "Create event"}
        </SubmitButton>
        <p className="mono text-eyebrow text-ink-muted">
          Draft events are invisible on the public site
        </p>
      </div>
    </form>
  );
}

/* ── Prize management (edit page only) ───────────────────────────────────── */

export function PrizeManager({
  eventId,
  prizes,
}: {
  eventId: string;
  prizes: { id: string; rank: string; amount: number | null; perk: string | null }[];
}) {
  const [addState, addAction] = useActionState(addPrize, idle);
  const [, deleteAction] = useActionState(deletePrize, idle);

  return (
    <div className="flex flex-col gap-5">
      {prizes.length > 0 ? (
        <ul className="flex flex-col border border-ink bg-block-white">
          {prizes.map((prize) => (
            <li
              key={prize.id}
              className="flex items-center justify-between gap-4 border-b border-ink p-4 last:border-b-0"
            >
              <div>
                <p className="mono text-eyebrow text-ink-muted">{prize.rank}</p>
                <p className="mt-1 text-[16px] font-medium">
                  {prize.amount ? formatPaise(prize.amount) : prize.perk}
                </p>
                {prize.amount && prize.perk ? (
                  <p className="text-[14px] text-ink-muted">{prize.perk}</p>
                ) : null}
              </div>
              <form action={deleteAction}>
                <input type="hidden" name="prizeId" value={prize.id} />
                <Button type="submit" size="sm" variant="secondary" arrow={false}>
                  Remove
                </Button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mono border border-ink bg-block-white px-4 py-3 text-label text-ink-muted">
          No prizes yet — the prizes section stays hidden on the public page.
        </p>
      )}

      <form action={addAction} className="flex flex-col gap-4 border border-ink bg-paper p-4">
        <input type="hidden" name="eventId" value={eventId} />
        <FormBanner state={addState} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Rank / name" htmlFor="rank" required error={fieldError(addState, "rank")}>
            <Input id="rank" name="rank" required placeholder="1st, or Best viva" />
          </Field>
          <Field label="Amount (₹)" htmlFor="amount" error={fieldError(addState, "amount")}>
            <Input id="amount" name="amount" type="number" min={0} />
          </Field>
        </div>

        <Field label="Perk" htmlFor="perk" hint="Used when a prize isn't cash.">
          <Input id="perk" name="perk" />
        </Field>

        <Field label="Sort order" htmlFor="sortOrder">
          <Input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={0} />
        </Field>

        <SubmitButton pendingLabel="Adding…">Add prize</SubmitButton>
      </form>
    </div>
  );
}

/* ── Quick status control (event list) ───────────────────────────────────── */

export function EventStatusForm({
  eventId,
  status,
}: {
  eventId: string;
  status: string;
}) {
  const [state, action] = useActionState(updateEventStatus, idle);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="eventId" value={eventId} />
      <div className="flex items-center gap-2">
        <Select
          name="status"
          defaultValue={status}
          aria-label="Event status"
          className="px-2 py-1.5 text-[13px]"
        >
          {STATUSES.map(([value]) => (
            <option key={value} value={value}>
              {value.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
        <Button type="submit" size="sm" variant="secondary" arrow={false}>
          Set
        </Button>
      </div>
      {state.status === "error" ? (
        <p role="alert" className="mono max-w-52 text-eyebrow">
          ▲ {state.message}
        </p>
      ) : null}
    </form>
  );
}
