import { format } from "date-fns";
import { Clock } from "lucide-react";
import Link from "next/link";
import { DeleteNewsletterButton } from "@/components/newsletters/delete-newsletter-button";
import { SubscribeButton } from "@/components/newsletters/subscribe-button";
import type { Frequency } from "@/lib/frequency";
import { getCategory } from "@/lib/categories";
import { cn } from "@/lib/utils";

type NewsletterCardProps = {
  newsletter: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    frequency: Frequency;
    keywords: string[];
    category: string; // categoryId slug
    isCustom?: boolean;
  };
  subscriptionId: string | null;
  nextRunIso: string;
};

export function NewsletterCard({
  newsletter,
  subscriptionId,
  nextRunIso,
}: NewsletterCardProps) {
  const cat = getCategory(newsletter.category);
  const Icon = cat.icon;
  const nextDate = new Date(nextRunIso);
  const nextDateLabel = format(nextDate, "EEE, MMM d");

  return (
    <div className="group relative rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-muted-foreground/30 hover:bg-secondary/50">
      <Link
        href={`/newsletters/${newsletter.slug}`}
        className="absolute inset-0 rounded-xl"
      />

      {/* Top row: content + button (desktop only button) */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110",
                cat.bg,
              )}
            >
              <Icon className={cn("h-5 w-5", cat.color)} />
            </div>
            <p className="text-base font-semibold text-foreground leading-snug">
              {newsletter.title}
            </p>
          </div>

          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-xs font-medium",
                cat.pill,
              )}
            >
              {cat.label}
            </span>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-xs font-medium",
                newsletter.frequency === "daily"
                  ? "border-accent/50 text-accent"
                  : "border-muted-foreground/30 text-muted-foreground",
              )}
            >
              {newsletter.frequency}
            </span>
          </div>

          {newsletter.description && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {newsletter.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {newsletter.keywords.slice(0, 3).map((kw) => (
              <span
                key={kw}
                className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
              >
                {kw}
              </span>
            ))}
            {newsletter.keywords.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{newsletter.keywords.length - 3} more
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Next: {nextDateLabel}
            </span>
          </div>
        </div>

        {/* Desktop: button top-right */}
        <div className="relative z-10 hidden shrink-0 sm:flex flex-col items-end gap-3">
          <SubscribeButton
            newsletterId={newsletter.id}
            subscriptionId={subscriptionId}
          />
          {newsletter.isCustom && (
            <DeleteNewsletterButton
              newsletterId={newsletter.id}
              newsletterTitle={newsletter.title}
            />
          )}
        </div>
      </div>

      {/* Mobile: full-width button at bottom */}
      <div className="relative z-10 mt-4 sm:hidden space-y-2">
        <SubscribeButton
          newsletterId={newsletter.id}
          subscriptionId={subscriptionId}
          className="w-full justify-center"
        />
        {newsletter.isCustom && (
          <DeleteNewsletterButton
            newsletterId={newsletter.id}
            newsletterTitle={newsletter.title}
            className="w-full justify-center"
          />
        )}
      </div>
    </div>
  );
}
