"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Bank } from "@/data/types";

export const columns: ColumnDef<Bank>[] = [
  {
    accessorKey: "bank_name",
    header: "Bank Name",
  },
  {
    accessorKey: "account_number",
    header: "Account Number",
  },
];