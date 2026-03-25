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
    category: string;
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
    <div className="group relative flex flex-col border border-border bg-card p-5 transition-all duration-300 hover:border-foreground/30">
      <Link
        href={`/newsletters/${newsletter.slug}`}
        className="absolute inset-0"
      />

      {/* Header: icon + title */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110",
            cat.bg,
          )}
        >
          <Icon className={cn("h-4 w-4", cat.color)} />
        </div>
        <p className="font-serif text-sm font-semibold leading-snug text-foreground">
          {newsletter.title}
        </p>
      </div>

      {/* Pills */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
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
              ? "border-foreground/30 text-foreground"
              : "border-muted-foreground/30 text-muted-foreground",
          )}
        >
          {newsletter.frequency}
        </span>
      </div>

      {/* Description */}
      {newsletter.description && (
        <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {newsletter.description}
        </p>
      )}

      {/* Keywords */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
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

      {/* Next run */}
      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        Next: {nextDateLabel}
      </div>

      {/* Spacer to push button to bottom */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="relative z-10 mt-4 space-y-2">
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
