"use client";

import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
};

export default function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Sum of the "buy" column
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalBuyAmount = data.reduce((sum, row: any) => {
    return sum + (row.buy || 0);
  }, 0);

  // Sum of the "sell" column
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalSellAmount = data.reduce((sum, row: any) => {
    return sum + (row.sell || 0);
  }, 0);

  return (
    <div className="w-full overflow-x-auto rounded-md border bg-card">
      <Table className="text-xs">
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => {
                return (
                  <TableHead key={h.id}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                )
              })}
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
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-semibold">Sum</TableCell>
            <TableCell className="font-semibold"></TableCell>
            <TableCell className="font-semibold"></TableCell>
            <TableCell className="font-semibold"></TableCell>
            <TableCell className="font-semibold"></TableCell>
            <TableCell className="font-semibold"></TableCell>
            <TableCell className="font-semibold">{totalBuyAmount.toFixed(2)} €</TableCell>
            <TableCell className="font-semibold">{totalSellAmount.toFixed(2)} €</TableCell>
            {columns.slice(2).map((_, index) => (
              <TableCell key={index} />
            ))}
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}