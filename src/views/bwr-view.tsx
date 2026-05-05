"use client";

import BwrFilterBar from "@/components/tables/bwr/filter-bar";
import DataTable from "@/components/tables/bwr/data-table";
import { getBwrData, BwrData } from "@/actions/bwr.action";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function BwrView() {
  const [params, setParams] = useState<{
    fromDate: Date;
    toDate: Date;
    type: "points" | "visits";
    threshold: number;
  } | null>(null);

  const { data, isLoading, error } = useQuery<BwrData>({
    queryKey: ["bwr", params?.fromDate, params?.toDate, params?.type, params?.threshold],
    queryFn: () => getBwrData(params!.fromDate, params!.toDate, params!.type, params!.threshold),
    enabled: params !== null,
  });

  return (
    <div className="gap-2 flex flex-col max-w-6xl mx-auto">
      <BwrFilterBar onCalculate={(fd, td, t, th) => {
        setParams({ fromDate: fd, toDate: td, type: t, threshold: th });
      }} />
      {isLoading && (
        <div className="flex items-center justify-center p-8 gap-2 text-sm text-muted-foreground">
          <Loader2 className="animate-spin h-5 w-5" />
          Calculating...
        </div>
      )}
      {error && (
        <div className="p-4 text-sm text-red-500 text-center">
          Error: {error instanceof Error ? error.message : "Unknown error"}
        </div>
      )}
      {data && params && (
        <DataTable data={data} threshold={params.threshold} type={params.type} />
      )}
    </div>
  );
}