"use client";

import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  selected: string;
  onChange: (category: string) => void;
}

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={() => onChange("all")}
        className={cn(
          "rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
          selected === "all"
            ? "bg-foreground text-background border-foreground"
            : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground",
        )}
      >
        All
      </button>
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const active = selected === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
              active
                ? cat.pill
                : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
