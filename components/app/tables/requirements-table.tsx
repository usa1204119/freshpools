"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { DataGrid, CellPrimary, CellMeta } from "../data-grid";
import {
  StatusBadge,
  requirementTone,
  humanizeEnum,
} from "@/components/ui/status-badge";
import { RequirementStatusForm } from "@/components/forms/admin-forms";
import { formatCtcRange, formatDate } from "@/lib/utils";

export type RequirementRow = {
  id: string;
  role: string;
  stack: string[];
  openings: number;
  ctcMin: number;
  ctcMax: number;
  location: string;
  isRemote: boolean;
  urgency: string;
  status: string;
  sponsorInterest: string | null;
  createdAt: string;
  companyName: string;
  contactPerson: string;
  contactEmail: string | null;
  contactPhone: string | null;
  introCount: number;
};

export function RequirementsTable({ rows }: { rows: RequirementRow[] }) {
  const columns = useMemo<ColumnDef<RequirementRow, unknown>[]>(
    () => [
      {
        accessorFn: (row) => `${row.role} ${row.stack.join(" ")}`,
        id: "role",
        header: "Role",
        cell: ({ row }) => (
          <>
            <CellPrimary>{row.original.role}</CellPrimary>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {row.original.stack.slice(0, 5).map((tech) => (
                <li
                  key={tech}
                  className="mono border border-ink px-1.5 py-0.5 text-eyebrow"
                >
                  {tech}
                </li>
              ))}
            </ul>
            <CellMeta>
              {row.original.openings}{" "}
              {row.original.openings === 1 ? "opening" : "openings"} ·{" "}
              {row.original.isRemote
                ? `${row.original.location} · remote ok`
                : row.original.location}
            </CellMeta>
          </>
        ),
      },
      {
        accessorFn: (row) =>
          `${row.companyName} ${row.contactPerson} ${row.contactEmail ?? ""}`,
        id: "company",
        header: "Company",
        cell: ({ row }) => (
          <>
            <CellPrimary>{row.original.companyName}</CellPrimary>
            <CellMeta>{row.original.contactPerson}</CellMeta>
            {row.original.contactEmail ? (
              <CellMeta>{row.original.contactEmail}</CellMeta>
            ) : null}
            {row.original.contactPhone ? (
              <CellMeta>{row.original.contactPhone}</CellMeta>
            ) : null}
            <CellMeta>{formatDate(row.original.createdAt)}</CellMeta>
          </>
        ),
      },
      {
        accessorFn: (row) => row.ctcMax,
        id: "ctc",
        header: "Package",
        cell: ({ row }) => (
          <span className="mono text-[12px] whitespace-nowrap">
            {formatCtcRange(row.original.ctcMin, row.original.ctcMax)}
          </span>
        ),
      },
      {
        accessorKey: "urgency",
        header: "Urgency",
        cell: ({ row }) => (
          <span className="mono text-[12px]">{humanizeEnum(row.original.urgency)}</span>
        ),
      },
      {
        accessorKey: "sponsorInterest",
        header: "Sponsor?",
        cell: ({ row }) => {
          const value = row.original.sponsorInterest;
          if (value === "yes") return <StatusBadge tone="done">Yes</StatusBadge>;
          if (value === "maybe") return <StatusBadge tone="pending">Maybe</StatusBadge>;
          return <StatusBadge tone="neutral">No</StatusBadge>;
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <>
            <StatusBadge tone={requirementTone[row.original.status] ?? "neutral"}>
              {humanizeEnum(row.original.status)}
            </StatusBadge>
            <CellMeta>
              {row.original.introCount} intro
              {row.original.introCount === 1 ? "" : "s"}
            </CellMeta>
          </>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-col gap-3">
            <RequirementStatusForm
              requirementId={row.original.id}
              status={row.original.status}
            />
            <Link
              href={`/admin/matching/${row.original.id}`}
              className="mono text-eyebrow underline underline-offset-4"
            >
              Match candidates →
            </Link>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <DataGrid
      data={rows}
      columns={columns}
      caption="All company requirements"
      searchPlaceholder="Role, stack, company…"
      minWidth={1200}
    />
  );
}
