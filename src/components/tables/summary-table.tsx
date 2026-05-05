"use client";

import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { getCashTransactionsByPlayer } from "@/actions/cash-transactions.action";
import { DateFilters } from "../cards/filter-bar";
import { Loader2 } from "lucide-react";

type SummaryTableProps = {
  client_id: string;
  filters: DateFilters;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + " €";

export default function SummaryTable({ client_id, filters }: SummaryTableProps) {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["cashTransactions", client_id, filters],
    queryFn: () => getCashTransactionsByPlayer(client_id, filters.startDate, filters.endDate),
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <Loader2 className="animate-spin h-6 w-6 text-gray-500 mx-auto" />
        <p className="text-sm text-gray-500 text-center mt-2">Loading transactions...</p>
      </div>
    );
  }

  // Grouper par (transaction, subtransaction) et sommer les montants
  const grouped = new Map<string, { transaction: string; subtransaction: string; total: number }>();
  for (const tx of transactions ?? []) {
    const key = `${tx.transaction}|${tx.subtransaction}`;
    const amount = tx.buy > 0 ? tx.buy : tx.sell > 0 ? tx.sell : (tx.value ?? 0);
    const existing = grouped.get(key);
    if (existing) {
      existing.total += amount;
    } else {
      grouped.set(key, { transaction: tx.transaction, subtransaction: tx.subtransaction, total: amount });
    }
  }
  const rows = Array.from(grouped.values()).sort((a, b) =>
    a.transaction.localeCompare(b.transaction) || a.subtransaction.localeCompare(b.subtransaction)
  );

  return (
    <Table>
      <TableCaption>Cumulated amounts by transaction type (cashdesk)</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Transaction</TableHead>
          <TableHead>Subtype</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={`${row.transaction}|${row.subtransaction}`}>
            <TableCell>{row.transaction}</TableCell>
            <TableCell>{row.subtransaction}</TableCell>
            <TableCell className="text-right">{formatCurrency(row.total)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}