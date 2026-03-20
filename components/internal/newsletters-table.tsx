"use client";

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteNewsletterById } from "@/app/actions/newsletters";
import { TriggerButton } from "@/components/internal/trigger-button";
import { AddNewsletterModal } from "@/components/newsletters/add-newsletter-modal";
import { cn } from "@/lib/utils";

type Category = {
  id: string;
  label: string;
};

type Newsletter = {
  id: string;
  title: string;
  slug: string;
  frequency: string;
  categoryId: string | null;
  createdBy: string | null;
  category: { label: string } | null;
  _count: { subscriptions: number; digestRuns: number };
};

type DigestRun = {
  id: string;
  status: string;
  runAt: Date;
  error: string | null;
  newsletter: { title: string };
};

function DeleteButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const [, startTransition] = useTransition();

  if (confirming) {
    return (
      <span className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Sure?</span>
        <button
          type="button"
          onClick={() => startTransition(() => deleteNewsletterById(id))}
          className="rounded px-2 py-0.5 text-xs font-medium text-red-500 hover:bg-red-500/10"
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
        >
          No
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="rounded p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
      title="Delete"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

export function NewslettersTable({
  newsletters,
  recentRuns,
  categories,
  page,
  totalPages,
  total,
}: {
  newsletters: Newsletter[];
  recentRuns: DigestRun[];
  categories: Category[];
  page: number;
  totalPages: number;
  total: number;
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [frequency, setFrequency] = useState<"all" | "daily" | "weekly">("all");
  const [type, setType] = useState<"all" | "system" | "user">("all");
  const [category, setCategory] = useState<string>("all");

  const filtered = newsletters.filter((n) => {
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (frequency !== "all" && n.frequency !== frequency) return false;
    if (type === "system" && n.createdBy !== null) return false;
    if (type === "user" && n.createdBy === null) return false;
    if (category !== "all" && n.categoryId !== category) return false;
    return true;
  });

  return (
    <div className="space-y-10">
      {/* Newsletters */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Newsletters
          </h2>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted/40 transition-colors"
          >
            + Add newsletter
          </button>
        </div>

        {/* Filters */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="h-8 w-48 rounded-md border border-border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring/50"
            />
          </div>

          <div className="flex rounded-md border border-border overflow-hidden text-xs font-medium">
            {(["all", "daily", "weekly"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFrequency(f)}
                className={cn(
                  "px-3 py-1.5 capitalize transition-colors",
                  frequency === f
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-muted/40",
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex rounded-md border border-border overflow-hidden text-xs font-medium">
            {(["all", "system", "user"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "px-3 py-1.5 capitalize transition-colors",
                  type === t
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-muted/40",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring/50"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          {(search ||
            frequency !== "all" ||
            type !== "all" ||
            category !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFrequency("all");
                setType("all");
                setCategory("all");
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          )}

          <span className="ml-auto text-xs text-muted-foreground">
            {filtered.length} of {newsletters.length}
          </span>
        </div>

        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Title
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Category
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Freq
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Type
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                  Subs
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                  Runs
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-sm text-muted-foreground"
                  >
                    No newsletters match filters
                  </td>
                </tr>
              )}
              {filtered.map((n) => (
                <tr key={n.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5">
                    <div>
                      <p className="font-medium text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground/60">
                        {n.slug}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    {n.category ? (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                        {n.category.label}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs capitalize text-muted-foreground">
                    {n.frequency}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        n.createdBy
                          ? "bg-accent/10 text-accent"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {n.createdBy ? "user" : "system"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm tabular-nums">
                    {n._count.subscriptions}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm tabular-nums">
                    {n._count.digestRuns}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <TriggerButton newsletterId={n.id} />
                      <Link
                        href={`/internal/newsletters/${n.id}/edit`}
                        className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <DeleteButton id={n.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages} · {total} total
            </span>
            <div className="flex items-center gap-1">
              <Link
                href={`/internal?page=${page - 1}`}
                aria-disabled={page <= 1}
                className={cn(
                  "rounded p-1.5 transition-colors",
                  page <= 1
                    ? "pointer-events-none text-muted-foreground/30"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/internal?page=${p}`}
                  className={cn(
                    "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                    p === page
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                  )}
                >
                  {p}
                </Link>
              ))}
              <Link
                href={`/internal?page=${page + 1}`}
                aria-disabled={page >= totalPages}
                className={cn(
                  "rounded p-1.5 transition-colors",
                  page >= totalPages
                    ? "pointer-events-none text-muted-foreground/30"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Recent runs */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Recent Digest Runs
        </h2>
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Newsletter
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Run At
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Error
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentRuns.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-sm text-muted-foreground"
                  >
                    No runs yet
                  </td>
                </tr>
              )}
              {recentRuns.map((run) => (
                <tr
                  key={run.id}
                  className="hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-2.5 font-medium">
                    {run.newsletter.title}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        run.status === "sent"
                          ? "bg-green-500/10 text-green-600"
                          : run.status === "failed"
                            ? "bg-red-500/10 text-red-500"
                            : "bg-yellow-500/10 text-yellow-600",
                      )}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {new Date(run.runAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-red-500">
                    {run.error ? (
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        {run.error}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showModal && (
        <AddNewsletterModal
          canCreate={true}
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
