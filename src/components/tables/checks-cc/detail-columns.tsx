"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { CashTransactionWithRelations } from "@/data/types";
import { ColumnDef } from "@tanstack/react-table";

export const chequeDetailColumns: ColumnDef<CashTransactionWithRelations>[] = [
  {
    accessorKey: "flow_datetime",
    header: "Date",
    cell: ({ row }) => new Date(row.original.flow_datetime).toLocaleDateString("en-US"),
  },
  {
    accessorKey: "buy",
    header: "Amount",
    cell: ({ row }) => `${row.original.buy.toFixed(2)} €`,
  },
  {
    accessorKey: "cheque_number",
    header: "Check Number",
    cell: ({ row }) => row.original.cheque_number ?? "-",
  },
  {
    accessorKey: "account_number",
    header: "Account Number",
    cell: ({ row }) => row.original.account_number ?? "-",
  },
  {
    accessorKey: "bank_name",
    header: "Bank Name",
    cell: ({ row }) => row.original.bank_name ?? "-",
  },
  {
    id: "is_guaranteed",
    header: "Guaranteed",
    cell: ({ row }) => (
      <Checkbox checked={row.original.is_guaranteed ?? false} disabled />
    ),
  },
  {
    accessorKey: "guarantee_number",
    header: "Guarantee Number",
    cell: ({ row }) => row.original.guarantee_number ?? "-",
  },
];

export const ccDetailColumns: ColumnDef<CashTransactionWithRelations>[] = [
  {
    accessorKey: "flow_datetime",
    header: "Date",
    cell: ({ row }) => new Date(row.original.flow_datetime).toLocaleDateString("en-US"),
  },
  {
    accessorKey: "buy",
    header: "Amount",
    cell: ({ row }) => `${row.original.buy.toFixed(2)} €`,
  },
];
