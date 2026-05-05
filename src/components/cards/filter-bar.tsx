"use client";

import { useState, useEffect } from "react";
import DatePickerInput from "../custom/date-picker";
import { Card } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Check } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export type DateFilters = {
  startDate: Date;
  endDate: Date;
};

type FilterBarProps = {
  filters: DateFilters;
  onFiltersChange: (filters: DateFilters) => void;
};

export default function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const [localStartDate, setLocalStartDate] = useState<Date>(filters.startDate);
  const [localEndDate, setLocalEndDate] = useState<Date>(filters.endDate);
  const [secondFilter, setSecondFilter] = useState<number>(6);

  const handleApplyFilters = () => {
    onFiltersChange({
      startDate: localStartDate,
      endDate: localEndDate,
    });
  };

  const handlePredefinedPeriod = (period: string) => {
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case "last_24_hours":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "last_7_days":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "last_30_days":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    setLocalStartDate(startDate);
    setLocalEndDate(now);
    onFiltersChange({ startDate, endDate: now });
  };

  return (
    <Card className="flex flex-row w-full">
      <div className="flex items-center px-2">
        <Label className="mr-4">Start date:</Label>
        <DatePickerInput
          value={localStartDate}
          onChange={(date) => date && setLocalStartDate(date)}
        />
      </div>
      <div className="flex items-center px-2">
        <Label className="mr-4">End date:</Label>
        <DatePickerInput
          value={localEndDate}
          onChange={(date) => date && setLocalEndDate(date)}
        />
      </div>
      <Select onValueChange={handlePredefinedPeriod}>
        <SelectTrigger className="w-full max-w-48">
          <SelectValue placeholder="Predefined period" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="last_24_hours">Last 24 hours</SelectItem>
            <SelectItem value="last_7_days">Last 7 days</SelectItem>
            <SelectItem value="last_30_days">Last 30 days</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <div className="flex items-center px-2">
        <Label className="mr-4">Seconds:</Label>
        <Input className="w-16" type="number" value={secondFilter} onChange={(e) => setSecondFilter(Number(e.target.value))} />
      </div>
      <Button variant="ghost" className="ml-auto" onClick={handleApplyFilters}>
        <Check className="text-green-700" />
      </Button>
    </Card>
  )
}