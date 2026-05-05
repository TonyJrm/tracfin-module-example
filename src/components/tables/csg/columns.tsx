import { CsgPlayerSummary } from "@/data/types";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";

export const columns: ColumnDef<CsgPlayerSummary>[] = [
  {
    accessorKey: "client_id",
    header: "Client ID",
    size: 0,
    enableHiding: true,
    meta: { hidden: true },
  },
  {
    accessorKey: "lastname",
    header: "Last Name",
    size: 160,
  },
  {
    accessorKey: "firstname",
    header: "First Name",
    size: 160,
  },
  {
    accessorKey: "birth_date",
    header: "Birth Date",
    size: 110,
    cell: ({ row }) => row.original.birth_date
      ? new Date(row.original.birth_date).toLocaleDateString("en-US")
      : "",
  },
  {
    accessorKey: "is_anpr",
    header: "ANPR",
    size: 60,
    cell: ({ row }) => <Checkbox checked={row.original.is_anpr ?? false} />,
  },
  {
    accessorKey: "is_im",
    header: "IM",
    size: 60,
    cell: ({ row }) => <Checkbox checked={row.original.is_im ?? false} />,
  },
  {
    accessorKey: "count",
    header: "Count",
    size: 80,
  },
  {
    accessorKey: "total_tax",
    header: "CSG amount",
    size: 130,
    cell: ({ row }) => `${row.original.total_tax.toFixed(2)} €`,
  },
  {
    accessorKey: "total_before_tax",
    header: "Amount before tax",
    size: 150,
    cell: ({ row }) => `${row.original.total_before_tax.toFixed(2)} €`,
  },
];
