"use client";

import { TitoTransaction } from "@/data/types";
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<TitoTransaction>[] = [
  {
    accessorKey: "ticket_number",
    header: "Ticket number",
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => `${row.original.amount} €`,
  },
  {
    accessorKey: "issuance_status",
    header: "Issuance status",
  },
  {
    accessorKey: "redemption_status",
    header: "Redemption status",
  },
  {
    accessorKey: "issuance_device",
    header: "Issuance device",
  },
  {
    accessorKey: "redemption_device",
    header: "Redemption device",
  },
  {
    accessorKey: "issuance_time",
    header: "Issuance time",
    cell: ({ row }) => new Date(row.original.issuance_time).toLocaleString(),
  },
  {
    accessorKey: "redemption_time",
    header: "Redemption time",
    cell: ({ row }) => row.original.redemption_time ? new Date(row.original.redemption_time).toLocaleString() : "N/A",
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "issuance_serial_number",
    header: "Issuance SN",
  },
  {
    accessorKey: "redemption_serial_number",
    header: "Redemption SN",
    cell: ({ row }) => row.original.redemption_serial_number || "N/A",
  },
];