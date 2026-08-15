"use client";

import { useActionState, useState } from "react";
import {
  refundAllForSponsoredEvent,
  refundCheckedInDeposits,
  saveAdminNote,
  saveScore,
  toggleCheckIn,
  updateRequirementStatus,
} from "@/lib/actions/admin";
import { createIntros, updateIntro } from "@/lib/actions/intro";
import { Field, Input, Select, Textarea, Checkbox } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { FormBanner, SubmitButton, fieldError } from "./controls";
import { JUDGING_CRITERIA } from "@/lib/content";
import type { ActionState } from "@/lib/validations";

const idle: ActionState = { status: "idle" };

/* ── Check-in toggle ─────────────────────────────────────────────────────── */

export function CheckInToggle({
  registrationId,
  checkedIn,
}: {
  registrationId: string;
  checkedIn: boolean;
}) {
  const [state, action] = useActionState(toggleCheckIn, idle);

  return (
    <form action={action}>
      <input type="hidden" name="registrationId" value={registrationId} />
      <button
        type="submit"
        aria-pressed={checkedIn}
        className={`mono border border-ink px-2 py-1 text-eyebrow ${
          checkedIn ? "bg-block-ink text-white" : "bg-block-white text-ink"
        }`}
      >
        {checkedIn ? "✓ In" : "Check in"}
      </button>
      {state.status === "error" ? (
        <span role="alert" className="mono ml-2 text-eyebrow">
          ▲
        </span>
      ) : null}
    </form>
  );
}

/* ── Bulk refunds ────────────────────────────────────────────────────────── */

export function RefundDepositsButton({
  eventId,
  eligibleCount,
}: {
  eventId: string;
  eligibleCount: number;
}) {
  const [state, action] = useActionState(refundCheckedInDeposits, idle);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="eventId" value={eventId} />
      <FormBanner state={state} />

      {!confirmed ? (
        <Button
          type="button"
          variant="secondary"
          arrow={false}
          disabled={eligibleCount === 0}
          onClick={() => setConfirmed(true)}
        >
          Refund deposits for checked-in ({eligibleCount})
        </Button>
      ) : (
        <div className="flex flex-col gap-3 border border-ink bg-block-coral p-4">
          <p className="text-[14px]">
            This issues {eligibleCount} real refund
            {eligibleCount === 1 ? "" : "s"} through Razorpay. It cannot be undone.
          </p>
          <div className="flex flex-wrap gap-3">
            <SubmitButton pendingLabel="Issuing refunds…">
              Yes, refund {eligibleCount}
            </SubmitButton>
            <Button
              type="button"
              variant="secondary"
              arrow={false}
              onClick={() => setConfirmed(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}

export function RefundAllButton({ eventId }: { eventId: string }) {
  const [state, action] = useActionState(refundAllForSponsoredEvent, idle);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="eventId" value={eventId} />
      <FormBanner state={state} />
      {!confirmed ? (
        <Button
          type="button"
          variant="secondary"
          arrow={false}
          onClick={() => setConfirmed(true)}
        >
          Refund everyone in full (event became sponsored)
        </Button>
      ) : (
        <div className="flex flex-col gap-3 border border-ink bg-block-coral p-4">
          <p className="text-[14px]">
            Refunds the full amount to everyone who already paid, and marks them
            waived. Irreversible.
          </p>
          <div className="flex flex-wrap gap-3">
            <SubmitButton pendingLabel="Refunding…">Yes, refund everyone</SubmitButton>
            <Button
              type="button"
              variant="secondary"
              arrow={false}
              onClick={() => setConfirmed(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}

/* ── Scoring ─────────────────────────────────────────────────────────────── */

const MAXIMA: Record<string, number> = {
  demo: 30,
  code: 25,
  fit: 25,
  viva: 20,
};

export function ScoreForm({
  submissionId,
  candidateId,
  candidateName,
  defaults = {},
}: {
  submissionId: string;
  candidateId: string;
  candidateName: string;
  defaults?: {
    demo?: number;
    code?: number;
    fit?: number;
    viva?: number;
    notes?: string;
    rank?: number;
    tier?: "A" | "B" | "C" | null;
    inTalentPool?: boolean;
  };
}) {
  const [state, action] = useActionState(saveScore, idle);
  const fieldId = `${submissionId}-${candidateId}`;

  return (
    <form action={action} className="flex flex-col gap-4 border border-ink bg-block-white p-5">
      <input type="hidden" name="submissionId" value={submissionId} />
      <input type="hidden" name="candidateId" value={candidateId} />

      <div className="flex items-center justify-between gap-3">
        <p className="font-sans text-[17px] font-bold">{candidateName}</p>
        {defaults.tier ? (
          <span className="mono border border-ink bg-block-ink px-2 py-1 text-eyebrow text-white">
            Tier {defaults.tier}
          </span>
        ) : null}
      </div>

      <FormBanner state={state} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {JUDGING_CRITERIA.map((criterion) => {
          const key = criterion.label.split(" ")[0].toLowerCase();
          const name =
            key === "working" ? "demo" : key === "problem" ? "fit" : key;
          return (
            <Field
              key={name}
              label={`${criterion.label} /${MAXIMA[name]}`}
              htmlFor={`${fieldId}-${name}`}
              error={fieldError(state, name)}
            >
              <Input
                id={`${fieldId}-${name}`}
                name={name}
                type="number"
                min={0}
                max={MAXIMA[name]}
                required
                defaultValue={defaults[name as "demo" | "code" | "fit" | "viva"] ?? 0}
              />
            </Field>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Rank" htmlFor={`${fieldId}-rank`} error={fieldError(state, "rank")}>
          <Input
            id={`${fieldId}-rank`}
            name="rank"
            type="number"
            min={1}
            defaultValue={defaults.rank ?? ""}
          />
        </Field>
        <Field label="Tier" htmlFor={`${fieldId}-tier`}>
          <Select id={`${fieldId}-tier`} name="tier" defaultValue={defaults.tier ?? ""}>
            <option value="">Leave unchanged</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </Select>
        </Field>
      </div>

      <Field
        label="Review note"
        htmlFor={`${fieldId}-notes`}
        hint="Internal only. Never shown to a company."
      >
        <Textarea id={`${fieldId}-notes`} name="notes" rows={3} defaultValue={defaults.notes} />
      </Field>

      <Checkbox
        id={`${fieldId}-pool`}
        name="inTalentPool"
        label="Onboard to the talent pool"
        defaultChecked={defaults.inTalentPool}
      />

      <SubmitButton pendingLabel="Saving…">Save score</SubmitButton>
    </form>
  );
}

/* ── Admin note ──────────────────────────────────────────────────────────── */

export function AdminNoteForm({
  candidateId,
  note,
}: {
  candidateId: string;
  note?: string | null;
}) {
  const [state, action] = useActionState(saveAdminNote, idle);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="candidateId" value={candidateId} />
      <Textarea
        name="adminNote"
        rows={3}
        defaultValue={note ?? ""}
        placeholder="Internal note — never shown to a company"
      />
      <div className="flex items-center gap-3">
        <SubmitButton pendingLabel="Saving…">Save note</SubmitButton>
        {state.status === "success" ? (
          <span role="status" className="mono text-eyebrow">
            ✓ Saved
          </span>
        ) : null}
      </div>
    </form>
  );
}

/* ── Requirement triage ──────────────────────────────────────────────────── */

export function RequirementStatusForm({
  requirementId,
  status,
}: {
  requirementId: string;
  status: string;
}) {
  const [state, action] = useActionState(updateRequirementStatus, idle);

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="requirementId" value={requirementId} />
      <Select
        name="status"
        defaultValue={status}
        aria-label="Requirement status"
        className="px-2 py-1.5 text-[13px]"
      >
        {["NEW", "QUALIFYING", "MATCHING", "SHORTLIST_SENT", "CLOSED", "LOST"].map(
          (option) => (
            <option key={option} value={option}>
              {option.replace(/_/g, " ")}
            </option>
          ),
        )}
      </Select>
      <Button type="submit" size="sm" variant="secondary" arrow={false}>
        {state.status === "success" ? "✓" : "Set"}
      </Button>
    </form>
  );
}

/* ── Matching → send intros ──────────────────────────────────────────────── */

export function SendIntrosForm({
  requirementId,
  candidates,
}: {
  requirementId: string;
  candidates: { id: string; name: string; tier: string | null; college: string }[];
}) {
  const [state, action] = useActionState(createIntros, idle);

  if (candidates.length === 0) {
    return (
      <p className="mono border border-ink bg-block-white px-4 py-3 text-label">
        No pool candidates available to introduce yet.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="requirementId" value={requirementId} />
      <FormBanner state={state} />

      <fieldset className="flex flex-col gap-2 border border-ink bg-block-white p-4">
        <legend className="mono bg-block-white px-2 text-eyebrow">
          ✦ Pick who to introduce
        </legend>
        {candidates.map((candidate) => (
          <Checkbox
            key={candidate.id}
            id={`cand-${candidate.id}`}
            name="candidateIds"
            value={candidate.id}
            label={
              <span>
                {candidate.name}
                <span className="mono ml-2 text-eyebrow text-ink-muted">
                  {candidate.tier ? `Tier ${candidate.tier} · ` : ""}
                  {candidate.college}
                </span>
              </span>
            }
          />
        ))}
      </fieldset>

      <Field label="Note to the candidate" htmlFor="intro-note">
        <Textarea id="intro-note" name="note" rows={3} />
      </Field>

      <SubmitButton pendingLabel="Sending…">Send introductions</SubmitButton>
      <p className="text-[13px] text-ink-muted">
        Each person is emailed and asked before their details go anywhere.
      </p>
    </form>
  );
}

/* ── Intro ledger row editor ─────────────────────────────────────────────── */

export function IntroUpdateForm({
  introId,
  status,
  offerCtc,
  feeAmount,
  joinedAt,
}: {
  introId: string;
  status: string;
  offerCtc?: number | null;
  feeAmount?: number | null;
  joinedAt?: string | null;
}) {
  const [state, action] = useActionState(updateIntro, idle);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button
        type="button"
        size="sm"
        variant="secondary"
        arrow={false}
        onClick={() => setOpen(true)}
      >
        Edit
      </Button>
    );
  }

  return (
    <form action={action} className="flex min-w-64 flex-col gap-3">
      <input type="hidden" name="introId" value={introId} />
      <FormBanner state={state} />

      <Select name="status" defaultValue={status} aria-label="Intro status">
        {[
          "SENT",
          "ACCEPTED",
          "INTERVIEWING",
          "OFFERED",
          "JOINED",
          "CLEARED",
          "PAID",
          "REJECTED",
          "WITHDRAWN",
        ].map((option) => (
          <option key={option} value={option}>
            {option.replace(/_/g, " ")}
          </option>
        ))}
      </Select>

      <Input
        name="joinedAt"
        type="date"
        aria-label="Joining date"
        defaultValue={joinedAt ?? ""}
      />
      <Input
        name="offerCtc"
        type="number"
        placeholder="Offer CTC (₹/yr)"
        aria-label="Offer CTC"
        defaultValue={offerCtc ?? ""}
      />
      <Input
        name="feeAmount"
        type="number"
        placeholder="Fee (₹)"
        aria-label="Fee amount"
        defaultValue={feeAmount ?? ""}
      />
      <Textarea name="note" rows={2} placeholder="Ledger note" />

      <div className="flex gap-2">
        <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          arrow={false}
          onClick={() => setOpen(false)}
        >
          Close
        </Button>
      </div>
    </form>
  );
}
