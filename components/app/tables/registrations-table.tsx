"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataGrid, CellPrimary, CellMeta } from "../data-grid";
import {
  StatusBadge,
  paymentTone,
  refundTone,
  humanizeEnum,
} from "@/components/ui/status-badge";
import { CheckInToggle } from "@/components/forms/admin-forms";
import { formatPaise } from "@/lib/utils";

export type RegistrationRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  college: string;
  gradYear: number;
  teamName: string | null;
  tshirtSize: string | null;
  paymentStatus: string;
  amountPaid: number;
  refundStatus: string;
  refundAmount: number | null;
  checkedIn: boolean;
};

/**
 * On event day an organiser needs to find one person by name in a list of
 * hundreds and check them in. That is the whole reason this table is
 * filterable rather than static.
 */
export function RegistrationsTable({ rows }: { rows: RegistrationRow[] }) {
  const columns = useMemo<ColumnDef<RegistrationRow, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Candidate",
        cell: ({ row }) => (
          <>
            <CellPrimary>{row.original.name}</CellPrimary>
            {/* Admins see contact details; companies never do. */}
            <CellMeta>{row.original.email}</CellMeta>
            {row.original.phone ? <CellMeta>{row.original.phone}</CellMeta> : null}
          </>
        ),
      },
      {
        accessorKey: "college",
        header: "College",
        cell: ({ row }) => (
          <>
            <span className="text-[14px]">{row.original.college}</span>
            <CellMeta>{row.original.gradYear}</CellMeta>
          </>
        ),
      },
      {
        accessorFn: (row) => row.teamName ?? "",
        id: "teamName",
        header: "Team",
        cell: ({ row }) =>
          row.original.teamName ? (
            <span className="text-[14px]">{row.original.teamName}</span>
          ) : (
            <StatusBadge tone="attention">None</StatusBadge>
          ),
      },
      {
        accessorKey: "tshirtSize",
        header: "Size",
        cell: ({ row }) => (
          <span className="mono text-[12px]">{row.original.tshirtSize ?? "—"}</span>
        ),
      },
      {
        accessorKey: "paymentStatus",
        header: "Payment",
        cell: ({ row }) => (
          <>
            <StatusBadge tone={paymentTone[row.original.paymentStatus] ?? "neutral"}>
              {humanizeEnum(row.original.paymentStatus)}
            </StatusBadge>
            <CellMeta>
              {row.original.amountPaid > 0 ? formatPaise(row.original.amountPaid) : "—"}
            </CellMeta>
          </>
        ),
      },
      {
        accessorKey: "refundStatus",
        header: "Refund",
        cell: ({ row }) => (
          <>
            <StatusBadge tone={refundTone[row.original.refundStatus] ?? "neutral"}>
              {humanizeEnum(row.original.refundStatus)}
            </StatusBadge>
            <CellMeta>
              {row.original.refundAmount ? formatPaise(row.original.refundAmount) : "—"}
            </CellMeta>
          </>
        ),
      },
      {
        id: "checkIn",
        header: "Check-in",
        enableSorting: false,
        cell: ({ row }) => (
          <CheckInToggle
            registrationId={row.original.id}
            checkedIn={row.original.checkedIn}
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
      caption="Event registrations"
      searchPlaceholder="Name, email, college, team…"
      minWidth={1040}
      pageSize={50}
    />
  );
}
