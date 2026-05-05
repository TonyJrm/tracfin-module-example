import { Requisition } from "@/data/types";
import { ColumnDef } from "@tanstack/react-table";

export const RequisitionColumns: ColumnDef<Requisition>[] = [
  {
    accessorKey: "requested_lastname",
    header: "Last Name",
    size: 160,
  },
  {
    accessorKey: "requested_firstname",
    header: "First Name",
    size: 160,
  },
  {
    accessorKey: "requested_birth_date",
    header: "Birth date",
    size: 110,
    cell: ({ row }) => row.original.requested_birth_date
      ? new Date(row.original.requested_birth_date).toLocaleDateString("en-US", {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
      })
      : "",
  },
  {
    accessorKey: "added_at",
    header: "Added at",
    size: 150,
    cell: ({ row }) => new Date(row.original.added_at).toLocaleString("en-US"),
  },
  {
    accessorKey: "found_at",
    header: "Found at",
    size: 150,
    cell: ({ row }) => row.original.found_at
      ? new Date(row.original.found_at).toLocaleString("en-US")
      : "",
  },
  {
    accessorKey: "remarks",
    header: "Remarks",
    size: 200,
  }
]