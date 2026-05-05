"use client";

import { getTitoTransactionsByPlayer } from "@/actions/tito-transactions.action";
import { columns } from "@/components/tables/tito/columns";
import DataTable from "@/components/tables/tito/data-table";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

type TitoViewProps = {
  client_id: string;
  filters: {
    startDate: Date;
    endDate: Date;
  };
};

export default function TitoView({ client_id, filters }: TitoViewProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["titoTransactions", client_id, filters.startDate, filters.endDate],
    queryFn: async () => {
      const response = await getTitoTransactionsByPlayer(client_id, filters.startDate, filters.endDate);
      return response;
    }
  })

  if (isLoading) {
    return (
      <div className="p-4">
        <Loader2 className="animate-spin h-6 w-6 text-gray-500 mx-auto" />
        <p className="text-sm text-gray-500 text-center mt-2">Loading TITO transactions...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500 text-center">No TITO transactions found for this player.</p>
      </div>
    );
  }

  return <DataTable columns={columns} data={data} />;
}