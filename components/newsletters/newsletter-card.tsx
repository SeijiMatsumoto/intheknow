import { format } from "date-fns";
import { Clock } from "lucide-react";
import Link from "next/link";
import { DeleteNewsletterButton } from "@/components/newsletters/delete-newsletter-button";
import { SubscribeButton } from "@/components/newsletters/subscribe-button";
import { getCategory } from "@/lib/newsletter/categories";
import type { Frequency } from "@/lib/date-utils";

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
  const isSubscribed = subscriptionId !== null;

  return (
    <div
      className={`group relative flex flex-col border transition-all duration-200 hover:shadow-md hover:border-foreground/25 ${
        isSubscribed
          ? "border-border border-l-foreground border-l-2 bg-secondary/40"
          : "border-border bg-card"
      }`}
    >
      <Link
        href={`/newsletters/${newsletter.slug}`}
        className="absolute inset-0"
      />

      {/* Header: icon + title + badges */}
      <div className="flex items-start gap-3 p-5 pb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60">
          <Icon className="h-4 w-4 text-foreground/70" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-foreground">
            {newsletter.title}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border border-foreground/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {cat.label}
            </span>
            <span className="rounded-full border border-foreground/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {newsletter.frequency}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      {newsletter.description && (
        <div className="border-t border-border/40 mx-5 pt-4 pb-3">
          <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
            {newsletter.description}
          </p>
        </div>
      )}

      {/* Keywords — comma separated */}
      {newsletter.keywords.length > 0 && (
        <div className="px-5 pb-4 pt-1">
          <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
            <span>topics: </span>
            <span className="uppercase tracking-wider text-muted-foreground/80">
              {newsletter.keywords.slice(0, 3).join(", ")}
              {newsletter.keywords.length > 3 &&
                `, +${newsletter.keywords.length - 3} more`}
            </span>
          </p>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer: next date + actions */}
      <div className="relative z-10 border-t border-border/40 px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            Next: {nextDateLabel}
          </div>
          <SubscribeButton
            newsletterId={newsletter.id}
            subscriptionId={subscriptionId}
          />
        </div>
      </div>
    </div>
  );
}
