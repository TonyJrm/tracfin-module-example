"use client";

import { cn } from "@/lib/utils";
import { PlayerSummaryRow } from "./columns";
import { useMemo } from "react";

type ChecksCcDataTableProps = {
  data: PlayerSummaryRow[];
  selectedClientId: string | null;
  onRowClick: (clientId: string) => void;
};

const COLS = { gridTemplateColumns: "repeat(4, 1fr)" };
const HEADER_CELL = "h-10 px-2 flex items-center font-medium text-muted-foreground text-xs whitespace-nowrap overflow-hidden";
const CELL = "p-2 flex items-center text-xs overflow-hidden";

export default function ChecksCcDataTable({ data, selectedClientId, onRowClick }: ChecksCcDataTableProps) {
  const sorted = useMemo(() => [...data].sort((a, b) => b.total_amount - a.total_amount), [data]);
  const total = data.reduce((s, r) => s + r.total_amount, 0);

  return (
    <div className="rounded-md border overflow-hidden bg-card">
      <div className="grid border-b bg-background" style={COLS}>
        <div className={HEADER_CELL}>Last Name</div>
        <div className={HEADER_CELL}>First Name</div>
        <div className={HEADER_CELL}>Birth Date</div>
        <div className={HEADER_CELL}>Total Amount</div>
      </div>
      <div style={{ maxHeight: 300, overflowY: "auto" }}>
        {sorted.length ? sorted.map((row) => (
          <div
            key={row.client_id}
            className={cn("grid border-b cursor-pointer transition-colors hover:bg-muted/50", row.client_id === selectedClientId && "bg-muted")}
            style={COLS}
            onClick={() => onRowClick(row.client_id)}
          >
            <div className={CELL}>{row.lastname}</div>
            <div className={CELL}>{row.firstname}</div>
            <div className={CELL}>{row.birth_date ? new Date(row.birth_date).toLocaleDateString() : "—"}</div>
            <div className={CELL}>{row.total_amount.toFixed(2)} €</div>
          </div>
        )) : (
          <div className="h-24 flex items-center justify-center text-xs text-muted-foreground">No results.</div>
        )}
      </div>
      <div className="grid border-t bg-muted/50" style={COLS}>
        <div className={cn(CELL, "font-semibold")} style={{ gridColumn: "span 3" }}>Total</div>
        <div className={cn(CELL, "font-semibold")}>{total.toFixed(2)} €</div>
      </div>
    </div>
  );
}

