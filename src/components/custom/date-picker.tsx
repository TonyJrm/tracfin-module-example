"use client";

import { useReducer, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

function formatDate(date: Date): string {
  if (!date || isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function parseDate(input: string): Date | undefined {
  if (!input) return undefined;
  const d = new Date(input);
  if (isNaN(d.getTime())) return undefined;
  // Always normalize to UTC midnight to avoid timezone drift
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

// Normalize any Date to UTC midnight (avoids local timezone serialization drift)
function toUtcMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

type State = {
  open: boolean;
  inputValue: string;
  selectedDate: Date | undefined;
};

type Action =
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "SELECT"; date: Date }
  | { type: "TYPE"; value: string }
  | { type: "SYNC"; date: Date | undefined };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "OPEN":
      return { ...state, open: true };
    case "CLOSE":
      return { ...state, open: false };
    case "SELECT":
      return {
        open: false,
        inputValue: formatDate(action.date),
        selectedDate: action.date,
      };
    case "TYPE": {
      const parsed = parseDate(action.value);
      return {
        ...state,
        inputValue: action.value,
        selectedDate: parsed,
      };
    }
    case "SYNC":
      return {
        ...state,
        inputValue: action.date ? formatDate(action.date) : "",
        selectedDate: action.date,
      };
    default:
      return state;
  }
}

type DatePickerInputProps = {
  id?: string;
  name?: string;
  value?: Date;
  defaultDate?: string;
  onChange?: (date: Date | undefined) => void;
  onBlur?: () => void;
  captionLayout?: "label" | "dropdown";
  startMonth?: Date;
  endMonth?: Date;
};

export default function DatePickerInput({
  id,
  name,
  value,
  defaultDate,
  onChange,
  onBlur,
  captionLayout = "label",
  startMonth,
  endMonth,
}: DatePickerInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  const initialDate = value ?? (defaultDate ? new Date(defaultDate) : undefined);
  const [state, dispatch] = useReducer(reducer, {
    open: false,
    inputValue: initialDate ? formatDate(initialDate) : "",
    selectedDate: initialDate,
  });

  // Sync external value
  useEffect(() => {
    dispatch({ type: "SYNC", date: value });
  }, [value]);

  // Calculate portal position when opening
  useEffect(() => {
    if (state.open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
  }, [state.open]);

  // Reposition on scroll/resize while open
  useEffect(() => {
    if (!state.open) return;
    const update = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
      }
    };
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [state.open]);

  // Close on click outside (both container and portal calendar)
  useEffect(() => {
    if (!state.open) return;
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      // Native select option clicks (OS dropdown) may fire mousedown with body/html as target
      if (target === document.body || target === document.documentElement) return;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        calendarRef.current && !calendarRef.current.contains(target)
      ) {
        dispatch({ type: "CLOSE" });
        onBlur?.();
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [state.open, onBlur]);

  return (
    <div ref={containerRef} className="relative inline-block w-48">
      <InputGroup>
        <InputGroupInput
          id={id}
          name={name}
          value={state.inputValue}
          placeholder="April 01, 2026"
          onChange={(e) => {
            dispatch({ type: "TYPE", value: e.target.value });
            const parsed = parseDate(e.target.value);
            if (parsed) onChange?.(parsed);
          }}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              dispatch({ type: "OPEN" });
            }
            if (e.key === "Escape") {
              dispatch({ type: "CLOSE" });
            }
          }}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Select date"
            onClick={() => dispatch({ type: state.open ? "CLOSE" : "OPEN" })}
          >
            <CalendarIcon />
            <span className="sr-only">Select date</span>
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>

      {state.open && pos && createPortal(
        <div
          ref={calendarRef}
          className={cn(
            "fixed overflow-hidden rounded-xl border bg-popover p-0 shadow-lg"
          )}
          style={{ top: pos.top, right: pos.right, zIndex: 9999, pointerEvents: "auto" }}
          onMouseDown={(e) => e.nativeEvent.stopPropagation()}
        >
          <Calendar
            mode="single"
            selected={state.selectedDate}
            defaultMonth={state.selectedDate ?? new Date()}
            captionLayout={captionLayout}
            startMonth={startMonth}
            endMonth={endMonth}
            onSelect={(date) => {
              if (date) {
                const normalized = toUtcMidnight(date);
                dispatch({ type: "SELECT", date: normalized });
                onChange?.(normalized);
              }
            }}
          />
        </div>,
        document.body
      )}
    </div>
  );
}
