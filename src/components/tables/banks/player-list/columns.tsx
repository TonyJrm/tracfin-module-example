"use client";

import { PlayerWithRelations } from "@/data/types";
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<PlayerWithRelations>[] = [
  {
    accessorKey: "client_id",
    enableHiding: true,
    meta: {
      hidden: true,
    },
  },
  {
    accessorKey: "lastname",
    header: "Last Name",
    size: 200,
  },
  {
    accessorKey: "firstname",
    header: "First Name",
    size: 200,
  },
  {
    accessorKey: "birth_date",
    header: "Birth Date",
    size: 150,
    cell: ({ row }) => row.original.birth_date ? new Date(row.original.birth_date).toLocaleDateString("en-US", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    }) : "-",
  },
  {
    header: "Count",
    size: 100,
    cell: ({ row }) => row.original.banks.length,
  }
];