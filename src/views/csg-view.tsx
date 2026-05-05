"use client";

import { getCsgSummaryByPlayer } from "@/actions/cash-transactions.action";
import DataTable from "@/components/tables/csg/data-table";
import CsgFilterBar from "@/components/tables/csg/filter-bar";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function CsgView() {
  const [calculationInProgress, setCalculationInProgress] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<{ from: Date; to: Date } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['csg-data', selectedDateRange?.from, selectedDateRange?.to],
    queryFn: async () => {
      console.log("Calculating CSG data for range:", selectedDateRange);
      const res = await getCsgSummaryByPlayer(selectedDateRange!.from, selectedDateRange!.to);
      console.log("CSG data received:", res.length, "records");
      setCalculationInProgress(false);
      return res;
    },
    enabled: calculationInProgress && selectedDateRange !== null,
  });

  return (
    <>
      <CsgFilterBar onCalculate={(fd, td) => {
        setSelectedDateRange({ from: fd, to: td });
        setCalculationInProgress(true);
      }} />
      {isLoading ? (
        <div className="p-4">
          <Loader2 className="animate-spin h-6 w-6 text-gray-500 mx-auto" />
          <p className="text-sm text-gray-500 text-center">Calculating CSG data...</p>
        </div>
      ) : error ? (
        <div className="p-4">
          <p className="text-sm text-red-500 text-center">Error loading CSG data: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      ) : data ? (
        <DataTable data={data} />
      ) : null}
    </>
  );
}