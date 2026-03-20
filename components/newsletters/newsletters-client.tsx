"use client"

import { useMemo, useState } from "react"
import { Search, Plus } from "lucide-react"
import { useQueryState } from "nuqs"
import { CategoryFilter } from "@/components/category-filter"
import { NewsletterCard } from "@/components/newsletter-card"
import { AddNewsletterModal } from "@/components/newsletters/add-newsletter-modal"

interface Newsletter {
  id: string
  title: string
  slug: string
  description: string | null
  frequency: string
  keywords: string[]
  category: string
}

interface NewsletterWithMeta {
  newsletter: Newsletter
  subscriptionId: string | null
  nextRunIso: string
}

interface Props {
  items: NewsletterWithMeta[]
  subscribedCount: number
  canCreateNewsletter: boolean
}

export function NewslettersClient({ items, subscribedCount, canCreateNewsletter }: Props) {
  const [category, setCategory] = useQueryState("category", { defaultValue: "all", shallow: true })
  const [searchQuery, setSearchQuery] = useQueryState("q", { defaultValue: "", shallow: true })
  const [showModal, setShowModal] = useState(false)

  const filteredItems = useMemo(() => {
    return items.filter(({ newsletter }) => {
      const matchesCategory = category === "all" || newsletter.category === category
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        query === "" ||
        newsletter.title.toLowerCase().includes(query) ||
        (newsletter.description ?? "").toLowerCase().includes(query) ||
        newsletter.keywords.some((kw) => kw.toLowerCase().includes(query))
      return matchesCategory && matchesSearch
    })
  }, [items, category, searchQuery])

  return (
    <>
      {showModal && (
        <AddNewsletterModal
          canCreate={canCreateNewsletter}
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false)
            window.location.reload()
          }}
        />
      )}

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col gap-4">
        <CategoryFilter selected={category} onChange={(v) => setCategory(v)} />
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-accent">{subscribedCount}</span> subscribed
            <span className="mx-2 inline-block h-1 w-1 rounded-full bg-muted-foreground/50 align-middle" />
            <span className="font-medium text-foreground">{filteredItems.length}</span> shown
          </p>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-56 rounded-lg border border-border bg-secondary pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex h-9 items-center gap-2 rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Add custom
            </button>
          </div>
        </div>
      </div>

      {/* Newsletter List */}
      <div className="space-y-4">
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
          <p className="text-lg font-medium text-foreground">No newsletters found</p>
          <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search or filter</p>
        </div>
      )}
    </>
  )
}
