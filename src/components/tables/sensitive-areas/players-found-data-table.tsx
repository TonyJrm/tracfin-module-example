"use client";

import { SensitiveAreasResult } from "@/data/types";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { foundPlayersColumns } from "./columns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type PlayersFoundDataTableProps = {
  data: SensitiveAreasResult
};

export default function PlayersFoundDataTable({ data }: PlayersFoundDataTableProps) {
  const table = useReactTable({
    columns: foundPlayersColumns,
    data: data.players_found,
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
                className="bg-primary/10 hover:bg-primary/15"
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
              <TableCell colSpan={foundPlayersColumns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}