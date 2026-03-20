import Link from "next/link"
import { Clock } from "lucide-react"
import { SubscribeButton } from "@/components/newsletters/subscribe-button"
import { getCategory } from "@/lib/categories"
import { cn } from "@/lib/utils"

interface NewsletterCardProps {
  newsletter: {
    id: string
    title: string
    slug: string
    description: string | null
    frequency: string
    keywords: string[]
    category: string // categoryId slug
  }
  subscriptionId: string | null
  nextRunIso: string
}

export function NewsletterCard({ newsletter, subscriptionId, nextRunIso }: NewsletterCardProps) {
  const cat = getCategory(newsletter.category)
  const Icon = cat.icon
  const nextDate = new Date(nextRunIso)
  const nextDateLabel = nextDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

  return (
    <div className="group relative rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-muted-foreground/30 hover:bg-secondary/50">
      <Link href={`/newsletters/${newsletter.slug}`} className="absolute inset-0 rounded-xl" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110", cat.bg)}>
            <Icon className={cn("h-6 w-6", cat.color)} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-lg font-semibold text-foreground">
                {newsletter.title}
              </span>
              <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", cat.pill)}>
                {cat.label}
              </span>
              <span className={cn(
                "rounded-full border px-2 py-0.5 text-xs font-medium",
                newsletter.frequency === "daily"
                  ? "border-accent/50 text-accent"
                  : "border-muted-foreground/30 text-muted-foreground"
              )}>
                {newsletter.frequency}
              </span>
            </div>

            {newsletter.description && (
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {newsletter.description}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {newsletter.keywords.slice(0, 3).map((kw) => (
                <span key={kw} className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                  {kw}
                </span>
              ))}
              {newsletter.keywords.length > 3 && (
                <span className="text-xs text-muted-foreground">+{newsletter.keywords.length - 3} more</span>
              )}
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Next: {nextDateLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex shrink-0 flex-col items-end gap-3">
          <SubscribeButton
            newsletterId={newsletter.id}
            subscriptionId={subscriptionId}
          />
        </div>
      </div>
    </div>
  )
}
