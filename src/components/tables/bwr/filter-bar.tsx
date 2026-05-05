"use client";

import MonthYearPickerInput from "@/components/custom/month-year-picker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";

type BwrFilterBarProps = {
  onCalculate: (fromDate: Date, toDate: Date, type: "points" | "visits", threshold: number) => void;
};

export default function BwrFilterBar({ onCalculate }: BwrFilterBarProps) {
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [type, setType] = useState<"points" | "visits">("points");
  const [threshold, setThreshold] = useState<number>(300);

  return (
    <Card className="flex flex-row justify-center items-center m-1 p-2">
      <div className="flex flex-row gap-2 items-center justify-between w-full">
        <RadioGroup
          defaultValue="points"
          onValueChange={(value) => setType(value as "points" | "visits")}
          className="flex w-fit"
        >
          <div className="flex items-center gap-3">
            <RadioGroupItem value="points" id="points" className="peer" />
            <Label htmlFor="points">
              Points
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <RadioGroupItem value="visits" id="visits" className="peer" />
            <Label htmlFor="visits">
              Visits
            </Label>
          </div>
        </RadioGroup>
        <div className="flex flex-row gap-4">
          <div className="flex items-center gap-3">
            <Label htmlFor="from">From</Label>
            <MonthYearPickerInput value={fromDate} onChange={setFromDate} />
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="to">To</Label>
            <MonthYearPickerInput value={toDate} onChange={setToDate} />
          </div>
          <Button className="w-fit" onClick={() => onCalculate(fromDate!, toDate!, type!, threshold!)} disabled={fromDate === undefined || toDate === undefined || type === undefined || threshold === undefined}>
            Calculate
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="threshold">Threshold (%)</Label>
          <Input className="w-24" type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
        </div>
      </div>
    </Card>
  )
}