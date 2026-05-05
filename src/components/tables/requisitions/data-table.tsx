"use client";

import { Requisition } from "@/data/types";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { RequisitionColumns } from "./columns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type DataTableProps = {
  data: Requisition[] | undefined;
  onRowClick?: (row: Requisition) => void;
  selectedId?: string | number | null;
};

export default function RequisitionsDataTable({ data, onRowClick, selectedId }: DataTableProps) {
  const table = useReactTable({
    data: data || [],
    columns: RequisitionColumns,
    getCoreRowModel: getCoreRowModel(),
  });

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
              <TableRow
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
                className={cn(
                  "cursor-pointer",
                  row.original.id === selectedId
                    ? "bg-primary/10 hover:bg-primary/15"
                    : "hover:bg-muted/50"
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={RequisitionColumns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}