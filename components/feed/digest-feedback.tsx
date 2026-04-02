"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { submitDigestFeedback } from "@/app/actions/digest-feedback";
import { cn } from "@/lib/utils";

type DigestFeedbackProps = {
  runId: string;
  existing: { rating: string; comment: string | null } | null;
};

export function DigestFeedback({ runId, existing }: DigestFeedbackProps) {
  const [rating, setRating] = useState<"up" | "down" | null>(
    (existing?.rating as "up" | "down") ?? null,
  );
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [commentSaved, setCommentSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleRating(value: "up" | "down") {
    if (value === rating) return;
    setRating(value);
    setCommentSaved(false);
    setSubmitting(true);
    await submitDigestFeedback(runId, value, null);
    setSubmitting(false);
  }

  async function handleCommentSubmit() {
    if (!rating) return;
    setSubmitting(true);
    await submitDigestFeedback(runId, rating, comment || null);
    setCommentSaved(true);
    setSubmitting(false);
  }

  return (
    <div className="mt-6 sm:mt-8 text-center">
      <div className="inline-flex flex-col items-center gap-3">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/50">
          How was this digest?
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleRating("up")}
            disabled={submitting}
            className={cn(
              "rounded-full border p-2.5 transition-all",
              rating === "up"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-border text-muted-foreground/40 hover:text-foreground hover:border-foreground/30",
            )}
          >
            <ThumbsUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleRating("down")}
            disabled={submitting}
            className={cn(
              "rounded-full border p-2.5 transition-all",
              rating === "down"
                ? "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400"
                : "border-border text-muted-foreground/40 hover:text-foreground hover:border-foreground/30",
            )}
          >
            <ThumbsDown className="h-4 w-4" />
          </button>
        </div>

        {rating && (
          <div className="flex flex-col items-center gap-2 w-full max-w-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
            <textarea
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setCommentSaved(false);
              }}
              placeholder="Any thoughts? (optional)"
              rows={3}
              className="w-full resize-none rounded-md border border-border bg-transparent px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-foreground/20"
            />
            <button
              type="button"
              onClick={handleCommentSubmit}
              disabled={submitting || commentSaved}
              className="rounded-md bg-foreground px-4 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              {submitting ? "Sending..." : commentSaved ? "Saved" : "Submit"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
