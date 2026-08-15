"use client";

import { useActionState, useState } from "react";
import {
  promoteEnquiryToCollege,
  toggleEnquiryHandled,
  updateCollegeStatus,
  updateCompanyFlags,
} from "@/lib/actions/admin";
import { Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "./controls";
import type { ActionState } from "@/lib/validations";

const idle: ActionState = { status: "idle" };

export function EnquiryActions({
  enquiryId,
  handled,
  alreadyLinked,
}: {
  enquiryId: string;
  handled: boolean;
  alreadyLinked: boolean;
}) {
  const [promoteState, promoteAction] = useActionState(promoteEnquiryToCollege, idle);
  const [toggleState, toggleAction] = useActionState(toggleEnquiryHandled, idle);

  const message =
    promoteState.status !== "idle"
      ? promoteState.message
      : toggleState.status !== "idle"
        ? toggleState.message
        : null;
  const isError =
    promoteState.status === "error" || toggleState.status === "error";

  return (
    <div className="flex flex-col gap-2">
      {message ? (
        <p
          role={isError ? "alert" : "status"}
          className="mono max-w-52 text-eyebrow"
        >
          {isError ? "▲" : "✓"} {message}
        </p>
      ) : null}

      {!alreadyLinked ? (
        <form action={promoteAction}>
          <input type="hidden" name="enquiryId" value={enquiryId} />
          <Button type="submit" size="sm" variant="secondary" arrow={false}>
            Create college record
          </Button>
        </form>
      ) : null}

      <form action={toggleAction}>
        <input type="hidden" name="enquiryId" value={enquiryId} />
        <Button type="submit" size="sm" variant="link" arrow={false}>
          {handled ? "Reopen" : "Mark handled"}
        </Button>
      </form>
    </div>
  );
}

export function CollegeStatusForm({
  collegeId,
  status,
}: {
  collegeId: string;
  status: string;
}) {
  const [state, action] = useActionState(updateCollegeStatus, idle);

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="collegeId" value={collegeId} />
      <Select
        name="status"
        defaultValue={status}
        aria-label="College status"
        className="px-2 py-1.5 text-[13px]"
      >
        <option value="PROSPECT">Prospect</option>
        <option value="ACTIVE">Active</option>
        <option value="PAST">Past</option>
      </Select>
      <Button type="submit" size="sm" variant="secondary" arrow={false}>
        {state.status === "success" ? "✓" : "Set"}
      </Button>
    </form>
  );
}

/**
 * Two-step because both flags have consequences outside this page: the partner
 * flag publishes a company name on the landing page, and the agreement flag is
 * what we rely on before making introductions.
 */
export function CompanyFlagToggle({
  companyId,
  flag,
  active,
  label,
  consequence,
}: {
  companyId: string;
  flag: "isHiringPartner" | "agreementSigned";
  active: boolean;
  label: string;
  consequence: string;
}) {
  const [state, action] = useActionState(updateCompanyFlags, idle);
  const [confirming, setConfirming] = useState(false);

  if (state.status === "success") {
    return (
      <p role="status" className="mono max-w-48 text-eyebrow">
        ✓ {state.message}
      </p>
    );
  }

  if (!confirming) {
    return (
      <Button
        type="button"
        size="sm"
        variant="secondary"
        arrow={false}
        onClick={() => setConfirming(true)}
      >
        {active ? `Remove ${label}` : `Set ${label}`}
      </Button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-2 border border-ink bg-block-coral p-3">
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="flag" value={flag} />
      <p className="max-w-48 text-[13px]">{consequence}</p>
      {state.status === "error" ? (
        <p role="alert" className="mono text-eyebrow">
          ▲ {state.message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <SubmitButton pendingLabel="Saving…">Confirm</SubmitButton>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          arrow={false}
          onClick={() => setConfirming(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
