"use client";

import DatePickerInput from "@/components/custom/date-picker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useState } from "react";

type GsgFiltersBarProps = {
  onCalculate: (fromDate: Date, toDate: Date) => void;
};

export default function CsgFilterBar({ onCalculate }: GsgFiltersBarProps) {
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  return (
    <Card className="flex flex-row justify-center items-center gap-3 m-1 p-2">
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-3">
          <Label htmlFor="from">From</Label>
          <DatePickerInput value={fromDate} onChange={setFromDate} />
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="to">To</Label>
          <DatePickerInput value={toDate} onChange={setToDate} />
        </div>
        <Button className="w-fit" onClick={() => onCalculate(fromDate!, toDate!)} disabled={fromDate === undefined || toDate === undefined}>
          Calculate
        </Button>
      </div>
    </Card>
  )
}