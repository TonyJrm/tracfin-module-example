"use client";

import { getCashTransactions } from "@/actions/cash-transactions.action";
import { ccDetailColumns, chequeDetailColumns } from "@/components/tables/checks-cc/detail-columns";
import ChecksCcDetailTable from "@/components/tables/checks-cc/detail-table";
import ChecksCcDataTable from "@/components/tables/checks-cc/data-table";
import { PlayerSummaryRow } from "@/components/tables/checks-cc/columns";
import ChecksCcFilterBar from "@/components/tables/checks-cc/filter-bar";
import { CashTransactionWithRelations } from "@/data/types";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

export default function ChecksCcView() {
  const [calculationInProgress, setCalculationInProgress] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<{ from: Date; to: Date } | null>(null);
  const [selectedType, setSelectedType] = useState<"checks" | "cc" | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['checks-cc-data', selectedType, selectedDateRange?.from, selectedDateRange?.to],
    queryFn: async () => {
      const transactionType = selectedType === "checks" ? "CHEQUE" : "CREDITCARD";
      return getCashTransactions(selectedDateRange!.from, selectedDateRange!.to, { transaction: transactionType });
    },
    enabled: calculationInProgress && selectedDateRange !== null && selectedType !== null,
  });

  const playerRows = useMemo<PlayerSummaryRow[]>(() => {
    if (!data) return [];
    const map = new Map<string, PlayerSummaryRow>();
    for (const tx of data) {
      if (!tx.players) continue;
      const existing = map.get(tx.client_id);
      if (existing) {
        existing.total_amount += tx.buy ?? 0;
      } else {
        map.set(tx.client_id, {
          client_id: tx.client_id,
          lastname: tx.players.lastname,
          firstname: tx.players.firstname,
          birth_date: tx.players.birth_date,
          total_amount: tx.buy ?? 0,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.lastname.localeCompare(b.lastname));
  }, [data]);

  const detailRows = useMemo<CashTransactionWithRelations[]>(() => {
    if (!data || !selectedClientId) return [];
    return data.filter((tx) => tx.client_id === selectedClientId);
  }, [data, selectedClientId]);

  const detailColumns = selectedType === "checks" ? chequeDetailColumns : ccDetailColumns;

  return (
    <>
      <ChecksCcFilterBar onCalculate={(fd, td, t) => {
        setSelectedClientId(null);
        setSelectedDateRange({ from: fd, to: td });
        setSelectedType(t);
        setCalculationInProgress(true);
      }} />
      {isLoading ? (
        <div className="p-4">
          <Loader2 className="animate-spin h-6 w-6 text-gray-500 mx-auto" />
          <p className="text-sm text-gray-500 text-center">Calculating data...</p>
        </div>
      ) : error ? (
        <div className="p-4">
          <p className="text-sm text-red-500 text-center">Error loading data: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      ) : data ? (
        <div className="flex flex-row gap-2 p-1">
          <div className="w-1/3 shrink-0">
            <ChecksCcDataTable
              data={playerRows}
              selectedClientId={selectedClientId}
              onRowClick={setSelectedClientId}
            />
          </div>
          <div className="flex-1 min-w-0">
            <ChecksCcDetailTable data={detailRows} columns={detailColumns} />
          </div>
        </div>
      ) : null}
    </>
  );
}