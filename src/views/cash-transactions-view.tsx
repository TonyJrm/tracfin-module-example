"use client";

import { getCashTransactionsByPlayer } from "@/actions/cash-transactions.action";
import { columns } from "@/components/tables/cash-transactions/columns";
import DataTable from "@/components/tables/cash-transactions/data-table";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

type CashTransactionsViewProps = {
  client_id: string;
  filters: {
    startDate: Date;
    endDate: Date;
  };
};

export default function CashTransactionsView({ client_id, filters }: CashTransactionsViewProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["cashTransactions", client_id, filters.startDate, filters.endDate],
    queryFn: async () => {
      return await getCashTransactionsByPlayer(client_id, filters.startDate, filters.endDate);
    }
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <Loader2 className="animate-spin h-6 w-6 text-gray-500 mx-auto" />
        <p className="text-sm text-gray-500 text-center">Loading cash transactions...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500 text-center">No cash transactions found for this player.</p>
      </div>
    );
  }

  return <DataTable columns={columns} data={data} />;
}