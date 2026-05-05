"use client";

import { CashTransaction } from "@/data/types";
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<CashTransaction>[] = [
  {
    accessorKey: "gamedate",
    header: "Game date",
    cell: ({ row }) => new Date(row.original.gamedate).toLocaleString("en-US", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    }),
  },
  {
    accessorKey: "flow_datetime",
    id: "flow_date",
    header: "Flow date",
    cell: ({ row }) => new Date(row.original.flow_datetime).toLocaleString("en-US", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    }),
  },
  {
    accessorKey: "flow_datetime",
    id: "flow_time",
    header: "Flow time",
    cell: ({ row }) => new Date(row.original.flow_datetime).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  },
  {
    accessorKey: "place",
    header: "Place",
  },
  {
    accessorKey: "transaction",
    header: "Transaction code",
  },
  {
    accessorKey: "subtransaction",
    header: "Subtransaction code",
  },
  {
    accessorKey: "buy",
    header: "Buy-in",
    cell: ({ row }) => row.original.buy ? `${row.original.buy} €` : "-",
  },
  {
    accessorKey: "sell",
    header: "Sell-out",
    cell: ({ row }) => row.original.sell ? `${row.original.sell} €` : "-",
  },
]