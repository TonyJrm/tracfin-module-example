/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExchangeGroupedRow, ExchangeRow } from "@/data/types";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

const fmt = (v: number) =>
  new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v) + " €";

const fmtDate = (d: Date | string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB") : "-";

const flatColumns: ColumnDef<ExchangeRow>[] = [
  { accessorKey: "client_id", header: "Client ID" },
  { accessorKey: "lastname", header: "Last name" },
  { accessorKey: "firstname", header: "First name" },
  {
    accessorKey: "birth_date",
    header: "Date of birth",
    cell: ({ row }) => fmtDate(row.original.birth_date),
  },
  {
    accessorKey: "flow_datetime",
    header: "Transaction date",
    cell: ({ row }) =>
      new Date(row.original.flow_datetime).toLocaleDateString("en-US"),
  },
  {
    accessorKey: "buy",
    header: "Buy",
    cell: ({ row }) => (row.original.buy > 0 ? fmt(row.original.buy) : "-"),
  },
  {
    accessorKey: "sell",
    header: "Sell",
    cell: ({ row }) => (row.original.sell > 0 ? fmt(row.original.sell) : "-"),
  },
];

const groupedColumns: ColumnDef<ExchangeGroupedRow>[] = [
  { accessorKey: "client_id", header: "Client ID" },
  { accessorKey: "lastname", header: "Last name" },
  { accessorKey: "firstname", header: "First name" },
  {
    accessorKey: "birth_date",
    header: "Date of birth",
    cell: ({ row }) => fmtDate(row.original.birth_date),
  },
  {
    accessorKey: "transaction_count",
    header: "Transactions",
  },
  {
    accessorKey: "total_buy",
    header: "Buy",
    cell: ({ row }) => fmt(row.original.total_buy),
  },
  {
    accessorKey: "total_sell",
    header: "Sell",
    cell: ({ row }) => fmt(row.original.total_sell),
  },
];

type Props =
  | { data: ExchangeRow[]; isGrouped: false }
  | { data: ExchangeGroupedRow[]; isGrouped: true };

export default function ExchangeDataTable({ data, isGrouped }: Props) {
  const totalBuy = data.reduce(
    (s, r: any) => s + (r.buy ?? r.total_buy ?? 0),
    0
  );
  const totalSell = data.reduce(
    (s, r: any) => s + (r.sell ?? r.total_sell ?? 0),
    0
  );

  const table = useReactTable({
    data: data as any[],
    columns: (isGrouped ? groupedColumns : flatColumns) as ColumnDef<any>[],
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full overflow-x-auto rounded-md border bg-card mt-2">
      <Table className="text-xs">
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableHead key={h.id}>
                  {h.isPlaceholder
                    ? null
                    : flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={isGrouped ? groupedColumns.length : flatColumns.length}
                className="h-24 text-center"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell
              colSpan={isGrouped ? 5 : 5}
              className="font-semibold"
            >
              Total ({data.length} {isGrouped ? "clients" : "transactions"})
            </TableCell>
            <TableCell className="font-semibold">{fmt(totalBuy)}</TableCell>
            <TableCell className="font-semibold">{fmt(totalSell)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
