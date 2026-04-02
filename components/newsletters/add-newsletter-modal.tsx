"use client";

import { Loader2, Lock, Sparkles, X } from "lucide-react";
import { useState, useTransition } from "react";
import type { GeneratedNewsletter } from "@/app/actions/generate-newsletter";
import { createUserNewsletter } from "@/app/actions/newsletters";
import { localToUtcHour } from "@/lib/date-utils";
import { NewsletterAiTab } from "./newsletter-ai-tab";
import {
  type NewsletterFormState,
  NewsletterManualForm,
} from "./newsletter-manual-form";

const DEFAULT_FORM: Omit<NewsletterFormState, "scheduleHour"> = {
  title: "",
  description: "",
  categoryId: "ai-tech",
  frequency: "weekly",
  scheduleDays: ["monday"],
  keywords: "",
};

type Props = {
  canCreate: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export function AddNewsletterModal({ canCreate, onClose, onCreated }: Props) {
  const [tab, setTab] = useState<"ai" | "manual">("ai");
  const [tzOffset] = useState(() => new Date().getTimezoneOffset());
  const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [form, setForm] = useState<NewsletterFormState>(() => ({
    ...DEFAULT_FORM,
    scheduleHour: localToUtcHour(8, new Date().getTimezoneOffset()),
  }));
  const [saving, startSaveTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function applyGenerated(data: GeneratedNewsletter) {
    setForm({
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      frequency: data.frequency,
      scheduleDays: data.scheduleDays as string[],
      scheduleHour: data.scheduleHour,
      keywords: data.keywords.join(", "),
    });
    setError(null);
    setTab("manual");
  }

  function handleSave() {
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    if (form.frequency === "weekly" && form.scheduleDays.length === 0) {
      setError("Select a delivery day");
      return;
    }
    setError(null);
    startSaveTransition(async () => {
      const keywords = form.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
      const result = await createUserNewsletter({ ...form, keywords });
      if (result.error) {
        setError(result.error);
      } else {
        onCreated();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            Add Newsletter
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Limit wall */}
        {!canCreate && (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Limit reached</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                You&apos;ve reached the maximum number of custom newsletters for
                your plan.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-lg bg-secondary px-5 py-2 text-sm font-medium text-foreground"
            >
              Got it
            </button>
          </div>
        )}

        {/* Tabs + Body */}
        {canCreate && (
          <>
            <div className="flex border-b border-border px-6">
              {(["ai", "manual"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`relative py-3 pr-6 text-sm font-medium transition-colors ${
                    tab === t
                      ? "text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-accent"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "ai" ? (
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      AI Generate
                    </span>
                  ) : (
                    "Manual Entry"
                  )}
                </button>
              ))}
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
              {tab === "ai" ? (
                <NewsletterAiTab
                  onGenerated={applyGenerated}
                  error={error}
                  onError={setError}
                />
              ) : (
                <NewsletterManualForm
                  form={form}
                  onChange={setForm}
                  tzOffset={tzOffset}
                  tzName={tzName}
                  error={error}
                />
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          {tab === "manual" && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving…" : "Create Newsletter"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
