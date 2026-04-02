"use client";

import { Plus, Search } from "lucide-react";
import { useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { NewsletterCard } from "@/components/newsletters/newsletter-card";
import { AddNewsletterModal } from "@/components/newsletters/add-newsletter-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Frequency } from "@/lib/date-utils";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";

type Newsletter = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  frequency: Frequency;
  keywords: string[];
  category: string;
  isCustom: boolean;
};

type NewsletterWithMeta = {
  newsletter: Newsletter;
  subscriptionId: string | null;
  nextRunIso: string;
};

type Props = {
  items: NewsletterWithMeta[];
  subscribedCount: number;
  canCreateNewsletter: boolean;
};

export function NewslettersClient({
  items,
  subscribedCount,
  canCreateNewsletter,
}: Props) {
  const [category, setCategory] = useQueryState("category", {
    defaultValue: "all",
    shallow: true,
  });
  const [frequency, setFrequency] = useState("all");
  const [searchQuery, setSearchQuery] = useQueryState("q", {
    defaultValue: "",
    shallow: true,
  });
  const [showModal, setShowModal] = useState(false);

  // Filter without frequency (for counting per-frequency totals)
  const applyBaseFilters = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return ({ newsletter }: NewsletterWithMeta) => {
      const matchesCategory =
        category === "all" || newsletter.category === category;
      const matchesSearch =
        query === "" ||
        newsletter.title.toLowerCase().includes(query) ||
        (newsletter.description ?? "").toLowerCase().includes(query) ||
        newsletter.keywords.some((kw) => kw.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    };
  }, [category, searchQuery]);

  const frequencyCounts = useMemo(() => {
    const base = items.filter(applyBaseFilters);
    return {
      all: base.length,
      daily: base.filter((i) => i.newsletter.frequency === "daily").length,
      weekly: base.filter((i) => i.newsletter.frequency === "weekly").length,
    };
  }, [items, applyBaseFilters]);

  const applyFilters = useMemo(() => {
    return (item: NewsletterWithMeta) => {
      if (!applyBaseFilters(item)) return false;
      return frequency === "all" || item.newsletter.frequency === frequency;
    };
  }, [applyBaseFilters, frequency]);

  const [showSubscribed, setShowSubscribed] = useState(false);

  const filteredItems = useMemo(() => {
    const filtered = items.filter((item) => {
      if (!applyFilters(item)) return false;
      if (showSubscribed && !item.subscriptionId) return false;
      return true;
    });
    // Sort subscribed first
    return filtered.sort((a, b) => {
      const aSubscribed = a.subscriptionId ? 0 : 1;
      const bSubscribed = b.subscriptionId ? 0 : 1;
      return aSubscribed - bSubscribed;
    });
  }, [items, applyFilters, showSubscribed]);

  return (
    <>
      {showModal && (
        <AddNewsletterModal
          canCreate={canCreateNewsletter}
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            window.location.reload();
          }}
        />
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3">
        {/* Search + filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search newsletters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full border border-border bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          <Select value={category} onValueChange={(v) => setCategory(v)}>
            <SelectTrigger className="shrink-0 h-9 min-w-[180px]">
              <SelectValue placeholder="All categories">
                {category === "all"
                  ? "All categories"
                  : (CATEGORIES.find((c) => c.id === category)?.label ??
                    category)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {[...CATEGORIES]
                .sort((a, b) => a.label.localeCompare(b.label))
                .map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <div className="hidden sm:flex h-9 shrink-0 items-center rounded-lg border border-border p-0.5">
            {(["all", "daily", "weekly"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFrequency(f)}
                className={cn(
                  "flex h-full items-center justify-center rounded-md px-3 text-sm font-medium transition-colors",
                  frequency === f
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f === "all" ? "All" : f === "daily" ? "Daily" : "Weekly"}
                <span className="ml-1.5 text-xs opacity-60">
                  {frequencyCounts[f]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats + Add custom */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSubscribed(!showSubscribed)}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors",
                showSubscribed
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
              )}
            >
              Subscribed
              <span className="opacity-60">{subscribedCount}</span>
            </button>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {filteredItems.length}
              </span>{" "}
              shown
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex h-9 shrink-0 items-center gap-1.5 border border-foreground bg-foreground px-3 text-sm font-medium text-background transition-opacity hover:opacity-80"
          >
            <Plus className="h-4 w-4" />
            Add custom
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map(({ newsletter, subscriptionId, nextRunIso }) => (
          <NewsletterCard
            key={newsletter.id}
            newsletter={newsletter}
            subscriptionId={subscriptionId}
            nextRunIso={nextRunIso}
          />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium text-foreground">
            No newsletters found
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your search or filter
          </p>
        </div>
      )}
    </>
  );
}
