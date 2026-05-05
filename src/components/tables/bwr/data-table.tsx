"use client";

import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { BwrData, BwrRow } from "@/actions/bwr.action";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface DataTableProps {
  data: BwrData;
  threshold: number;
  type: "points" | "visits";
}

interface DerivedRow extends BwrRow {
  moyenne: number;
  seuil: number;
}

const ROW_H = 36;
const TABLE_H = 520;

// Column widths in px
const LEFT_W = [100, 80, 80, 40, 40] as const;  // Last name, First name, Birth date, ANPR, IM
const RIGHT_W = [60, 60, 50, 50, 50, 70] as const; // Total, Avg., Blue, Red, Alerts, Threshold
const MONTH_W = 75;

// Inline background colors (Tailwind dynamic classes are not scanned)
const BG_BLUE = "#dbeafe";
const BG_RED = "#fee2e2";
const BG_YELLOW = "#fef9c3";

function formatDate(d: Date | null): string {
  if (!d) return "";
  const date = new Date(d);
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}/${date.getFullYear()}`;
}

function formatMonthKey(k: string): string {
  const [y, m] = k.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function fmtVal(v: number, type: "points" | "visits"): string {
  if (v === 0) return "";
  return type === "visits" ? String(v) : v.toFixed(0);
}

const CELL = "flex items-center px-2 text-xs border-r border-b overflow-hidden whitespace-nowrap shrink-0";
const H_CELL = `${CELL} font-semibold text-muted-foreground justify-center`;

export default function DataTable({ data, threshold, type }: DataTableProps) {
  "use no memo";
  const { rows, monthKeys } = data;
  const parentRef = useRef<HTMLDivElement>(null);

  const derived = useMemo<DerivedRow[]>(() => {
    const mapped = rows.map((row) => ({
      ...row,
      moyenne: monthKeys.length > 0 ? row.total / monthKeys.length : 0,
      seuil: (monthKeys.length > 0 && threshold > 0)
        ? (row.total / monthKeys.length) * (threshold / 100)
        : 0,
    }));

    // Sort alerts
    mapped.sort((a, b) => {
      if (b.nb_alerte !== a.nb_alerte) return b.nb_alerte - a.nb_alerte;
      if (b.nb_active_months !== a.nb_active_months) return b.nb_active_months - a.nb_active_months;
      if (b.nb_rouge !== a.nb_rouge) return b.nb_rouge - a.nb_rouge;
      return b.nb_bleu - a.nb_bleu;
    });

    return mapped;
  }, [rows, monthKeys, threshold]);

  const virtualizer = useVirtualizer({
    count: derived.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_H,
    overscan: 15,
  });

  const allWidths = [
    ...LEFT_W,
    ...Array<number>(monthKeys.length).fill(MONTH_W),
    ...RIGHT_W,
  ];
  const gridCols = allWidths.map((w) => `${w}px`).join(" ");
  const totalWidth = allWidths.reduce((a, b) => a + b, 0);

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: gridCols,
    minWidth: totalWidth,
  };

  const LEFT_HEADERS = ["Last name", "First name", "Birth date", "ANPR", "IM"] as const;
  // Right headers with their bg colors
  const RIGHT_HEADERS: { label: string; bg?: string }[] = [
    { label: "Total" },
    { label: "Avg." },
    { label: "Blue", bg: BG_BLUE },
    { label: "Red", bg: BG_RED },
    { label: "Alerts", bg: BG_YELLOW },
    { label: "Threshold" },
  ];

  return (
    <div
      ref={parentRef}
      style={{ height: TABLE_H, overflowX: "auto", overflowY: "auto" }}
      className="border rounded-md bg-card"
    >
      {/* Sticky header */}
      <div style={{ ...gridStyle, position: "sticky", top: 0, zIndex: 20 }} className="bg-muted">
        {LEFT_HEADERS.map((h) => (
          <div key={h} className={H_CELL} style={{ height: ROW_H }}>{h}</div>
        ))}
        {monthKeys.map((k) => (
          <div key={k} className={H_CELL} style={{ height: ROW_H }}>{formatMonthKey(k)}</div>
        ))}
        {RIGHT_HEADERS.map(({ label, bg }) => (
          <div
            key={label}
            className={H_CELL}
            style={{ height: ROW_H, backgroundColor: bg ?? undefined }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Virtualized body */}
      <div style={{ height: virtualizer.getTotalSize(), position: "relative", minWidth: totalWidth }}>
        {virtualizer.getVirtualItems().map((vItem) => {
          const row = derived[vItem.index];
          return (
            <div
              key={row.client_id}
              style={{
                ...gridStyle,
                position: "absolute",
                top: vItem.start,
                left: 0,
                height: ROW_H,
              }}
            >
              <div className={CELL}>{row.lastname}</div>
              <div className={CELL}>{row.firstname}</div>
              <div className={`${CELL} justify-center`}>{formatDate(row.birth_date)}</div>
              <div className={`${CELL} justify-center`}>
                <Checkbox checked={row.is_anpr ?? false} disabled />
              </div>
              <div className={`${CELL} justify-center`}>
                <Checkbox checked={row.is_im ?? false} disabled />
              </div>
              {monthKeys.map((k, idx) => {
                const val = row.months[k] ?? 0;
                const isAlert = val > 0 && row.seuil > 0 && row.nb_active_months > 1 && val > row.seuil;
                const bg = isAlert ? BG_YELLOW
                  : val === 0 && idx < row.nb_bleu ? BG_BLUE
                    : val === 0 && row.nb_rouge > 0 && idx > monthKeys.length - 1 - row.nb_rouge ? BG_RED
                      : undefined;
                const handpayCount = isAlert ? (row.handpay_months[k] ?? 0) : 0;
                const cell = (
                  <div
                    key={k}
                    className={`${CELL} justify-end`}
                    style={bg ? { backgroundColor: bg } : undefined}
                  >
                    {fmtVal(val, type)}
                  </div>
                );
                if (isAlert) {
                  return (
                    <Tooltip key={k}>
                      <TooltipTrigger asChild>{cell}</TooltipTrigger>
                      <TooltipContent>
                        {handpayCount > 0
                          ? `${handpayCount} HANDPAY${handpayCount > 1 ? "S" : ""}`
                          : "Aucun HANDPAY"}
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return cell;
              })}
              <div className={`${CELL} justify-end font-medium`}>{fmtVal(row.total, type)}</div>
              <div className={`${CELL} justify-end`}>{row.moyenne.toFixed(1)}</div>
              <div className={`${CELL} justify-end font-medium`} style={{ backgroundColor: BG_BLUE }}>
                {row.nb_bleu}
              </div>
              <div className={`${CELL} justify-end font-medium`} style={{ backgroundColor: BG_RED }}>
                {row.nb_rouge}
              </div>
              <div className={`${CELL} justify-end font-medium`} style={{ backgroundColor: BG_YELLOW }}>
                {row.nb_alerte}
              </div>
              <div className={`${CELL} justify-end`}>
                {row.seuil > 0 ? row.seuil.toFixed(2) : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
