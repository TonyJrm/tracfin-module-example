"use client";

import { useState } from "react";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Field } from "../ui/field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "../ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

type MonthYearPickerInputProps = {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
};

export default function MonthYearPickerInput({
  value,
  onChange,
  placeholder = "Month YYYY",
}: MonthYearPickerInputProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => value?.getFullYear() ?? new Date().getFullYear());

  const selectedMonth = value?.getMonth();
  const selectedYear = value?.getFullYear();

  function handleSelect(monthIndex: number) {
    const date = new Date(viewYear, monthIndex, 1);
    onChange?.(date);
    setOpen(false);
  }

  return (
    <Field className="mx-auto w-48">
      <InputGroup>
        <InputGroupInput
          value={value ? formatMonthYear(value) : ""}
          placeholder={placeholder}
          readOnly
          className="cursor-pointer"
          onClick={() => setOpen(true)}
        />
        <InputGroupAddon align="inline-end">
          <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o && value) setViewYear(value.getFullYear()); }}>
            <PopoverTrigger asChild>
              <InputGroupButton
                variant="ghost"
                size="icon-xs"
                aria-label="Select month and year"
              >
                <CalendarIcon />
                <span className="sr-only">Select month and year</span>
              </InputGroupButton>
            </PopoverTrigger>
            <PopoverContent
              className="w-64 p-3"
              align="end"
              alignOffset={-8}
              sideOffset={10}
            >
              {/* Year navigation */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setViewYear((y) => y - 1)}
                  aria-label="Previous year"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold">{viewYear}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setViewYear((y) => y + 1)}
                  aria-label="Next year"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>

              {/* Month grid */}
              <div className="grid grid-cols-3 gap-1">
                {MONTHS.map((label, i) => {
                  const isSelected = selectedMonth === i && selectedYear === viewYear;
                  return (
                    <button
                      key={label}
                      onClick={() => handleSelect(i)}
                      className={cn(
                        "rounded-md py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                        isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
}
