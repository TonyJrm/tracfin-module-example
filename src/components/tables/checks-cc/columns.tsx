import { ColumnDef } from "@tanstack/react-table";

export type PlayerSummaryRow = {
  client_id: string;
  lastname: string;
  firstname: string;
  birth_date: Date | null;
  total_amount: number;
};

export const playerSummaryColumns: ColumnDef<PlayerSummaryRow>[] = [
  {
    accessorKey: "lastname",
    header: "Last Name",
  },
  {
    accessorKey: "firstname",
    header: "First Name",
  },
  {
    accessorKey: "birth_date",
    header: "Birth Date",
    cell: ({ row }) =>
      row.original.birth_date
        ? new Date(row.original.birth_date).toLocaleDateString("en-US")
        : "-",
  },
  {
    accessorKey: "total_amount",
    header: "Total Amount",
    cell: ({ row }) => `${row.original.total_amount.toFixed(2)} €`,
  },
];