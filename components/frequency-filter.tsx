"use client";

import { cn } from "@/lib/utils";

type FrequencyFilter = "all" | "daily" | "weekly";

interface FrequencyFilterProps {
  selected: FrequencyFilter;
  onChange: (filter: FrequencyFilter) => void;
  counts: {
    all: number;
    daily: number;
    weekly: number;
  };
}

export function FrequencyFilter({
  selected,
  onChange,
  counts,
}: FrequencyFilterProps) {
  const options: { value: FrequencyFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
  ];

  return (
    <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
            selected === option.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
          <span
            className={cn(
              "text-xs",
              selected === option.value
                ? "text-accent"
                : "text-muted-foreground",
            )}
          >
            {counts[option.value]}
          </span>
        </button>
      ))}
    </div>
  );
}
