"use client";

import {
  getExchangeRegister,
  getExchangeRegisterGrouped,
} from "@/actions/exchange-register.action";
import ExchangeDataTable from "@/components/tables/exchange/data-table";
import ExchangeFilterBar from "@/components/tables/exchange/filter-bar";
import { ExchangeGroupedRow, ExchangeRow } from "@/data/types";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";

type QueryParams = {
  isGrouped: boolean;
  fromDate: Date;
  toDate: Date;
};

export default function ExchangeRegisterView() {
  const [queryParams, setQueryParams] = useState<QueryParams | null>(null);

  const { data, isLoading, error } = useQuery<
    ExchangeRow[] | ExchangeGroupedRow[]
  >({
    queryKey: ["exchange-register", queryParams],
    queryFn: async () => {
      if (!queryParams) return [];
      if (queryParams.isGrouped) {
        return getExchangeRegisterGrouped(
          queryParams.fromDate,
          queryParams.toDate
        );
      }
      return getExchangeRegister(queryParams.fromDate, queryParams.toDate);
    },
    enabled: queryParams !== null,
  });

  return (
    <>
      <ExchangeFilterBar
        onCalculate={(_cageType, isGrouped, fromDate, toDate) =>
          setQueryParams({ isGrouped, fromDate, toDate })
        }
      />
      {isLoading ? (
        <div className="p-8 flex justify-center">
          <Loader2 className="animate-spin h-6 w-6 text-gray-500" />
        </div>
      ) : error ? (
        <div className="p-4">
          <p className="text-sm text-red-500 text-center">
            Error: {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      ) : data && queryParams ? (
        queryParams.isGrouped ? (
          <ExchangeDataTable
            data={data as ExchangeGroupedRow[]}
            isGrouped={true}
          />
        ) : (
          <ExchangeDataTable data={data as ExchangeRow[]} isGrouped={false} />
        )
      ) : null}
    </>
  );
}