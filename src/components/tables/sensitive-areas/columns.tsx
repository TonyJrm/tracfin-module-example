import { PlayersFoundInSensitiveAreas, SensitiveArea } from "@/data/types";
import { ColumnDef } from "@tanstack/react-table";

export const streetColumns: ColumnDef<SensitiveArea>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "street",
    header: "Street",
  },
  {
    accessorKey: "city",
    header: "City",
  }
];

export const foundPlayersColumns: ColumnDef<PlayersFoundInSensitiveAreas>[] = [
  {
    accessorKey: "last_visit",
    header: "Last Visit",
    cell: ({ row }) => row.original.last_visit ? new Date(row.original.last_visit).toLocaleDateString("en-US") : "-",
  },
  {
    accessorKey: "client_id",
    header: "Client ID",
  },
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
    cell: ({ row }) => row.original.birth_date ? new Date(row.original.birth_date).toLocaleDateString("en-US") : "-",
  },
  {
    accessorKey: "address",
    header: "Address",
  },
  {
    accessorKey: "city",
    header: "City",
  },
];