"use client";

import { useRef } from "react";
import { flexRender, getCoreRowModel, useReactTable, VisibilityState } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { columns } from "./columns";
import { CsgPlayerSummary } from "@/data/types";

type DataTableProps = {
  data: CsgPlayerSummary[];
};

export default function DataTable({ data }: DataTableProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnVisibility: { client_id: false } as VisibilityState,
    },
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 35,
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  const totalCount = data.reduce((sum, row) => sum + row.count, 0);
  const totalBeforeTax = data.reduce((sum, row) => sum + row.total_before_tax, 0);
  const totalTax = data.reduce((sum, row) => sum + row.total_tax, 0);

  return (
    <div className="w-full rounded-md border text-xs flex flex-col max-h-[600px] bg-card">
      <div className="flex border-b bg-background z-10 shrink-0">
        {table.getHeaderGroups().map((hg) =>
          hg.headers.map((h) => (
            <div
              key={h.id}
              className="h-10 px-2 flex items-center font-medium text-muted-foreground"
              style={{ flex: `${h.getSize()} 0 0`, minWidth: 0 }}
            >
              {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
            </div>
          ))
        )}
      </div>

      <div ref={tableContainerRef} className="overflow-auto flex-1">
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}>
          {virtualItems.map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <div
                key={row.id}
                className="flex items-center border-b hover:bg-muted/50 transition-colors"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <div
                    key={cell.id}
                    className="px-2 truncate"
                    style={{ flex: `${cell.column.getSize()} 0 0`, minWidth: 0 }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            );
          })}
          {rows.length === 0 && (
            <div className="h-24 flex items-center justify-center text-muted-foreground">
              No results.
            </div>
          )}
        </div>
      </div>

      <div className="flex border-t bg-muted font-semibold shrink-0">
        <div className="h-10 px-2 flex items-center" style={{ flex: "160 0 0", minWidth: 0 }}>
          {data.length} player{data.length > 1 ? "s" : ""}
        </div>
        <div className="h-10 px-2 flex items-center" style={{ flex: "160 0 0", minWidth: 0 }} />
        <div className="h-10 px-2 flex items-center" style={{ flex: "110 0 0", minWidth: 0 }} />
        <div className="h-10 px-2 flex items-center" style={{ flex: "60 0 0", minWidth: 0 }} />
        <div className="h-10 px-2 flex items-center" style={{ flex: "60 0 0", minWidth: 0 }} />
        <div className="h-10 px-2 flex items-center" style={{ flex: "80 0 0", minWidth: 0 }}>
          {totalCount}
        </div>
        <div className="h-10 px-2 flex items-center" style={{ flex: "130 0 0", minWidth: 0 }}>
          {totalTax.toFixed(2)} &euro;
        </div>
        <div className="h-10 px-2 flex items-center" style={{ flex: "150 0 0", minWidth: 0 }}>
          {totalBeforeTax.toFixed(2)} &euro;
        </div>
      </div>
    </div>
  );
}