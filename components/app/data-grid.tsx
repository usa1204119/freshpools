"use client";

import { useState, useMemo, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Sortable, filterable, paginated admin table.
 *
 * Styling matches the static tables elsewhere — 1px ink borders, no zebra
 * stripes, mono column headers. Sorting is a real need on these screens: the
 * talent pool and the intros ledger both grow without bound, and scanning a
 * 300-row unsorted table is not a workflow.
 */
export function DataGrid<T>({
  data,
  columns,
  caption,
  searchPlaceholder = "Filter…",
  pageSize = 25,
  minWidth = 900,
  empty,
}: {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  caption: string;
  searchPlaceholder?: string;
  pageSize?: number;
  minWidth?: number;
  empty?: ReactNode;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const rows = table.getRowModel().rows;
  const total = data.length;
  const filtered = table.getFilteredRowModel().rows.length;

  const pageInfo = useMemo(() => {
    const { pageIndex, pageSize: size } = table.getState().pagination;
    if (filtered === 0) return "No rows";
    const from = pageIndex * size + 1;
    const to = Math.min((pageIndex + 1) * size, filtered);
    return `${from}–${to} of ${filtered}${filtered !== total ? ` (filtered from ${total})` : ""}`;
  }, [table, filtered, total]);

  if (total === 0 && empty) return <>{empty}</>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-3">
          <span className="mono text-eyebrow text-ink-muted">Filter</span>
          <Input
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-64 px-3 py-2 text-[14px]"
            type="search"
          />
        </label>
        <p className="mono text-eyebrow text-ink-muted" aria-live="polite">
          {pageInfo}
        </p>
      </div>

      <div className="overflow-x-auto border border-ink">
        <table
          className="w-full border-collapse bg-block-white text-left"
          style={{ minWidth }}
        >
          <caption className="sr-only">{caption}</caption>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-ink">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={
                        sorted === "asc"
                          ? "ascending"
                          : sorted === "desc"
                            ? "descending"
                            : undefined
                      }
                      className="mono border-r border-ink text-eyebrow whitespace-nowrap text-ink-muted last:border-r-0"
                    >
                      {canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-block-yellow"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          <span aria-hidden="true" className="text-ink">
                            {sorted === "asc" ? "↑" : sorted === "desc" ? "↓" : "↕"}
                          </span>
                        </button>
                      ) : (
                        <span className="block px-4 py-3">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={table.getAllColumns().length}
                  className="px-4 py-8 text-center text-[15px] text-ink-muted"
                >
                  Nothing matches that filter.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-ink last:border-b-0">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="border-r border-ink px-4 py-4 align-top last:border-r-0"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {table.getPageCount() > 1 ? (
        <div className="flex items-center justify-between gap-4">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            arrow={false}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            ← Previous
          </Button>
          <p className="mono text-eyebrow text-ink-muted">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            arrow={false}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next →
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/** Shared cell helpers so admin tables stay visually consistent. */
export function CellPrimary({ children }: { children: ReactNode }) {
  return <p className="font-medium">{children}</p>;
}

export function CellMeta({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("mono mt-1 text-eyebrow text-ink-muted", className)}>{children}</p>
  );
}
