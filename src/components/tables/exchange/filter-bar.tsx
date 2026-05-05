"use client";

import DatePickerInput from "@/components/custom/date-picker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useReducer } from "react";

type CageType = "slots" | "tables" | "elec_tables" | "all";

type FilterState = {
  cageType: CageType;
  isGrouped: boolean;
  fromDate: Date | undefined;
  toDate: Date | undefined;
};

type FilterAction =
  | { type: "SET_CAGE_TYPE"; payload: CageType }
  | { type: "SET_IS_GROUPED"; payload: boolean }
  | { type: "SET_FROM_DATE"; payload: Date | undefined }
  | { type: "SET_TO_DATE"; payload: Date | undefined };

type ExchangeFilterBarProps = {
  onCalculate: (
    cageType: CageType,
    isGrouped: boolean,
    fromDate: Date,
    toDate: Date
  ) => void;
};

function reducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case "SET_CAGE_TYPE":
      return { ...state, cageType: action.payload };
    case "SET_IS_GROUPED":
      return { ...state, isGrouped: action.payload };
    case "SET_FROM_DATE":
      return { ...state, fromDate: action.payload };
    case "SET_TO_DATE":
      return { ...state, toDate: action.payload };
    default:
      return state;
  };
}

const initialState: FilterState = {
  cageType: "all",
  isGrouped: true,
  fromDate: undefined,
  toDate: undefined,
};

export default function ExchangeFilterBar({ onCalculate }: ExchangeFilterBarProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { cageType, isGrouped, fromDate, toDate } = state;

  return (
    <Card className="flex flex-row justify-center items-center m-1 p-2">
      <div className="flex flex-row gap-2 items-center justify-between w-full">
        <RadioGroup
          defaultValue="all"
          onValueChange={(value) => dispatch({ type: "SET_CAGE_TYPE", payload: value as CageType })}
          className="flex w-fit"
        >
          <div className="flex items-center gap-3">
            <RadioGroupItem value="all" id="all" />
            <Label htmlFor="all">Unique cage</Label>
          </div>
          {(["slots", "tables", "elec_tables"] as const).map((id) => (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-3 opacity-40 cursor-not-allowed select-none">
                  <RadioGroupItem value={id} id={id} disabled />
                  <Label htmlFor={id} className="cursor-not-allowed capitalize">
                    {id === "elec_tables" ? "Electronic Tables" : id.charAt(0).toUpperCase() + id.slice(1)}
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>This casino group operates a single cage</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </RadioGroup>
        <div className="flex">
          <Checkbox id="grouped" checked={isGrouped} onCheckedChange={(checked) => dispatch({ type: "SET_IS_GROUPED", payload: checked === true })} />
          <Label htmlFor="grouped" className="ml-2">
            Group by client
          </Label>
        </div>
        <div className="flex flex-row gap-4">
          <div className="flex items-center gap-3">
            <Label htmlFor="from">From</Label>
            <DatePickerInput value={fromDate} onChange={(date) => dispatch({ type: "SET_FROM_DATE", payload: date })} />
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="to">To</Label>
            <DatePickerInput value={toDate} onChange={(date) => dispatch({ type: "SET_TO_DATE", payload: date })} />
          </div>
        </div>
        <Button className="w-fit" onClick={() => onCalculate(cageType, isGrouped, fromDate!, toDate!)} disabled={fromDate === undefined || toDate === undefined || cageType === undefined}>
          Calculate
        </Button>
      </div>
    </Card>
  );
}