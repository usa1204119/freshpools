"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataGrid, CellPrimary, CellMeta } from "../data-grid";
import { StatusBadge, introTone, humanizeEnum } from "@/components/ui/status-badge";
import { IntroUpdateForm } from "@/components/forms/admin-forms";
import { candidateHandle, daysUntil, formatDate, formatLpa } from "@/lib/utils";

export type IntroRow = {
  id: string;
  candidateId: string;
  candidateName: string;
  tier: string | null;
  companyName: string;
  role: string;
  sentAt: string;
  joinedAt: string | null;
  joinedAtInput: string | null;
  clearsAt: string | null;
  offerCtc: number | null;
  feeAmount: number | null;
  feeStatus: string;
  status: string;
};

/**
 * The revenue ledger. Sorting by the 90-day clock is the point: the question
 * this table exists to answer is "who is about to become invoiceable".
 */
export function IntrosTable({ rows }: { rows: IntroRow[] }) {
  const columns = useMemo<ColumnDef<IntroRow, unknown>[]>(
    () => [
      {
        accessorKey: "candidateName",
        header: "Candidate",
        cell: ({ row }) => (
          <>
            <CellPrimary>{row.original.candidateName}</CellPrimary>
            <CellMeta>
              {candidateHandle(row.original.candidateId)}
              {row.original.tier ? ` · Tier ${row.original.tier}` : ""}
            </CellMeta>
          </>
        ),
      },
      {
        accessorKey: "companyName",
        header: "Company / role",
        cell: ({ row }) => (
          <>
            <CellPrimary>{row.original.companyName}</CellPrimary>
            <CellMeta>{row.original.role}</CellMeta>
          </>
        ),
      },
      {
        accessorKey: "sentAt",
        header: "Sent",
        cell: ({ row }) => (
          <span className="mono text-[12px] whitespace-nowrap">
            {formatDate(row.original.sentAt)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge tone={introTone[row.original.status] ?? "neutral"}>
            {humanizeEnum(row.original.status)}
          </StatusBadge>
        ),
      },
      {
        // Sort by the raw remaining days so "due soonest" is one click away.
        accessorFn: (row) =>
          row.clearsAt ? daysUntil(row.clearsAt) : Number.POSITIVE_INFINITY,
        id: "clearsAt",
        header: "Clears in",
        cell: ({ row }) => {
          if (!row.original.clearsAt) {
            return <span className="mono text-[12px]">—</span>;
          }
          const days = daysUntil(row.original.clearsAt);
          return days > 0 ? (
            <span className="mono text-[12px] whitespace-nowrap">{days} days</span>
          ) : (
            <StatusBadge tone="pending">Cleared</StatusBadge>
          );
        },
      },
      {
        accessorFn: (row) => row.offerCtc ?? 0,
        id: "offerCtc",
        header: "Offer",
        cell: ({ row }) => (
          <span className="mono text-[12px] whitespace-nowrap">
            {row.original.offerCtc ? formatLpa(row.original.offerCtc) : "—"}
          </span>
        ),
      },
      {
        accessorFn: (row) => row.feeAmount ?? 0,
        id: "feeAmount",
        header: "Fee",
        cell: ({ row }) => (
          <>
            <span className="mono text-[12px] whitespace-nowrap">
              {row.original.feeAmount
                ? `₹${row.original.feeAmount.toLocaleString("en-IN")}`
                : "—"}
            </span>
            <CellMeta>{humanizeEnum(row.original.feeStatus)}</CellMeta>
          </>
        ),
      },
      {
        id: "edit",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <IntroUpdateForm
            introId={row.original.id}
            status={row.original.status}
            offerCtc={row.original.offerCtc}
            feeAmount={row.original.feeAmount}
            joinedAt={row.original.joinedAtInput}
          />
        ),
      },
    ],
    [],
  );

  return (
    <DataGrid
      data={rows}
      columns={columns}
      caption="Introduction ledger"
      searchPlaceholder="Candidate, company, role…"
      minWidth={1200}
    />
  );
}
