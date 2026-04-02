"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type NewsletterOption = {
  slug: string;
  title: string;
};

type FeedFiltersProps = {
  newsletters: NewsletterOption[];
  filters: {
    newsletter?: string;
    frequency?: string;
    dateRange?: string;
  };
};

const DATE_RANGE_LABELS: Record<string, string> = {
  all: "All time",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

const FREQUENCY_LABELS: Record<string, string> = {
  all: "All frequencies",
  daily: "Daily",
  weekly: "Weekly",
};

const triggerClass =
  "rounded-none border-foreground/15 bg-transparent text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors h-8";

export function FeedFilters({ newsletters, filters }: FeedFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("limit");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const newsletterValue = filters.newsletter ?? "all";
  const frequencyValue = filters.frequency ?? "all";
  const dateRangeValue = filters.dateRange ?? "all";

  const isActive = (value: string) =>
    value !== "all" ? "border-foreground text-foreground" : "";

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/40 mr-1">
        Filter
      </span>
      <Select
        value={newsletterValue}
        onValueChange={(v) => updateParam("newsletter", v ?? "all")}
      >
        <SelectTrigger
          className={`${triggerClass} min-w-[220px] ${isActive(newsletterValue)}`}
        >
          <SelectValue placeholder="All newsletters">
            {newsletterValue === "all"
              ? "All newsletters"
              : (newsletters.find((nl) => nl.slug === newsletterValue)?.title ??
                newsletterValue)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All newsletters</SelectItem>
          {newsletters.map((nl) => (
            <SelectItem key={nl.slug} value={nl.slug}>
              {nl.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={frequencyValue}
        onValueChange={(v) => updateParam("frequency", v ?? "all")}
      >
        <SelectTrigger
          className={`${triggerClass} ${isActive(frequencyValue)}`}
        >
          <SelectValue placeholder="All frequencies">
            {FREQUENCY_LABELS[frequencyValue] ?? frequencyValue}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All frequencies</SelectItem>
          <SelectItem value="daily">Daily</SelectItem>
          <SelectItem value="weekly">Weekly</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={dateRangeValue}
        onValueChange={(v) => updateParam("dateRange", v ?? "all")}
      >
        <SelectTrigger
          className={`${triggerClass} ${isActive(dateRangeValue)}`}
        >
          <SelectValue placeholder="All time">
            {DATE_RANGE_LABELS[dateRangeValue] ?? dateRangeValue}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All time</SelectItem>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="30d">Last 30 days</SelectItem>
          <SelectItem value="90d">Last 90 days</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
