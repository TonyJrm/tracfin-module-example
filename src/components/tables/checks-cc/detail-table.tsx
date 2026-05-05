"use client";

import { CashTransactionWithRelations } from "@/data/types";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useMemo } from "react";

type DetailTableProps = {
  data: CashTransactionWithRelations[];
  columns: ColumnDef<CashTransactionWithRelations>[];
};

const HEADER_CELL = "h-10 px-2 flex items-center font-medium text-muted-foreground text-xs whitespace-nowrap overflow-hidden";
const CELL = "p-2 flex items-center text-xs overflow-hidden";

export default function ChecksCcDetailTable({ data, columns }: DetailTableProps) {
  const sorted = useMemo(() => [...data].sort((a, b) => (b.buy ?? 0) - (a.buy ?? 0)), [data]);

  const table = useReactTable({ data: sorted, columns, getCoreRowModel: getCoreRowModel() });

  const total = data.reduce((s, r) => s + (r.buy ?? 0), 0);
  const colCount = columns.length;
  const gridStyle = { gridTemplateColumns: `repeat(${colCount}, 1fr)` };

  return (
    <div className="rounded-md border overflow-hidden bg-card">
      <div className="grid border-b bg-background" style={gridStyle}>
        {table.getHeaderGroups().map((hg) =>
          hg.headers.map((h) => (
            <div key={h.id} className={HEADER_CELL}>
              {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
            </div>
          ))
        )}
      </div>
      <div style={{ maxHeight: 300, overflowY: "auto" }}>
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => (
            <div key={row.id} className="grid border-b transition-colors hover:bg-muted/50" style={gridStyle}>
              {row.getVisibleCells().map((cell) => (
                <div key={cell.id} className={CELL}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="h-24 flex items-center justify-center text-xs text-muted-foreground">
            Select a player to see details.
          </div>
        )}
      </div>
      <div className="grid border-t bg-muted/50" style={gridStyle}>
        <div className={`${CELL} font-semibold`}>Total</div>
        <div className={`${CELL} font-semibold`}>{total.toFixed(2)} €</div>
        {Array.from({ length: colCount - 2 }).map((_, i) => <div key={i} />)}
      </div>
    </div>
  );
}
