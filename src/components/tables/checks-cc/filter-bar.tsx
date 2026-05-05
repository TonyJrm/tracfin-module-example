"use client";

import DatePickerInput from "@/components/custom/date-picker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";

type ChecksCcFilterBarProps = {
  onCalculate: (fromDate: Date, toDate: Date, type: "checks" | "cc") => void;
};

export default function ChecksCcFilterBar({ onCalculate }: ChecksCcFilterBarProps) {
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [type, setType] = useState<"checks" | "cc">("checks");

  return (
    <Card className="flex flex-row justify-center items-center m-1 p-2">
      <div className="flex flex-row gap-2 items-center justify-between w-full">
        <RadioGroup
          defaultValue="checks"
          onValueChange={(value) => setType(value as "checks" | "cc")}
          className="flex w-fit"
        >
          <div className="flex items-center gap-3">
            <RadioGroupItem value="checks" id="checks" className="peer" />
            <Label htmlFor="checks">
              Checks
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <RadioGroupItem value="cc" id="cc" className="peer" />
            <Label htmlFor="cc">
              Credit Cards
            </Label>
          </div>
        </RadioGroup>
        <div className="flex flex-row gap-4">
          <div className="flex items-center gap-3">
            <Label htmlFor="from">From</Label>
            <DatePickerInput value={fromDate} onChange={setFromDate} />
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="to">To</Label>
            <DatePickerInput value={toDate} onChange={setToDate} />
          </div>
        </div>
        <Button className="w-fit" onClick={() => onCalculate(fromDate!, toDate!, type!)} disabled={fromDate === undefined || toDate === undefined || type === undefined}>
          Calculate
        </Button>
      </div>
    </Card>
  );
}