"use client";

import { Loader2, Lock, Sparkles, X } from "lucide-react";
import { useState, useTransition } from "react";
import {
  type GeneratedNewsletter,
  generateNewsletterFields,
} from "@/app/actions/generate-newsletter";
import { createUserNewsletter } from "@/app/actions/newsletters";
import { CATEGORIES } from "@/lib/categories";

const ALL_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const HOURS = [...Array(24).keys()] as number[];

// getTimezoneOffset() returns minutes BEHIND UTC (positive = west, negative = east)
// local = UTC - offset/60
function utcToLocalHour(utcHour: number, offsetMinutes: number): number {
  return (((utcHour - offsetMinutes / 60) % 24) + 24) % 24;
}

function localToUtcHour(localHour: number, offsetMinutes: number): number {
  return (((localHour + offsetMinutes / 60) % 24) + 24) % 24;
}

function formatHour(h: number): string {
  const period = h >= 12 ? "PM" : "AM";
  const display = h % 12 || 12;
  return `${display}:00 ${period}`;
}

type FormState = {
  title: string;
  description: string;
  categoryId: string;
  frequency: "daily" | "weekly";
  scheduleDays: string[];
  scheduleHour: number;
  keywords: string;
};

const DEFAULT_FORM: Omit<FormState, "scheduleHour"> = {
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
  const [prompt, setPrompt] = useState("");
  const [tzOffset] = useState(() => new Date().getTimezoneOffset());
  const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [form, setForm] = useState<FormState>(() => ({
    ...DEFAULT_FORM,
    scheduleHour: localToUtcHour(8, new Date().getTimezoneOffset()),
  }));
  const [aiGenerating, startAiTransition] = useTransition();
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
    setTab("manual");
  }

  function handleGenerate() {
    if (!prompt.trim()) return;
    setError(null);
    startAiTransition(async () => {
      const result = await generateNewsletterFields(prompt);
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        applyGenerated(result.data);
      }
    });
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

  function selectDay(day: string) {
    setForm((f) => ({ ...f, scheduleDays: [day] }));
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

        {/* Upgrade wall */}
        {!canCreate && (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Pro feature</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Custom newsletters are available on the Pro plan. Upgrade to
                create newsletters tailored to any topic.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-lg bg-accent px-5 py-2 text-sm font-medium text-accent-foreground"
            >
              Upgrade to Pro
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
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Describe the newsletter you want and AI will configure
                    everything for you.
                  </p>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. A weekly digest of the latest AI agent frameworks, new LLM releases, and practical agentic coding tools for engineers…"
                    rows={5}
                    className="w-full resize-none rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={aiGenerating || !prompt.trim()}
                    className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity disabled:opacity-50"
                  >
                    {aiGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {aiGenerating ? "Generating…" : "Generate"}
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Title */}
                  <div>
                    <label
                      htmlFor="modal-title"
                      className="mb-1.5 block text-sm font-medium text-foreground"
                    >
                      Title
                    </label>
                    <input
                      id="modal-title"
                      type="text"
                      value={form.title}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, title: e.target.value }))
                      }
                      placeholder="Newsletter title"
                      className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      htmlFor="modal-description"
                      className="mb-1.5 block text-sm font-medium text-foreground"
                    >
                      Description
                    </label>
                    <textarea
                      id="modal-description"
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                      placeholder="What will subscribers get?"
                      rows={2}
                      className="w-full resize-none rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label
                      htmlFor="modal-category"
                      className="mb-1.5 block text-sm font-medium text-foreground"
                    >
                      Category
                    </label>
                    <select
                      id="modal-category"
                      value={form.categoryId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, categoryId: e.target.value }))
                      }
                      className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Frequency */}
                  <div>
                    <p className="mb-1.5 text-sm font-medium text-foreground">
                      Frequency
                    </p>
                    <div className="flex gap-3">
                      {(["daily", "weekly"] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() =>
                            setForm((s) => ({
                              ...s,
                              frequency: f,
                              scheduleDays:
                                f === "daily"
                                  ? []
                                  : s.scheduleDays.length > 0
                                    ? [s.scheduleDays[0]]
                                    : ["monday"],
                            }))
                          }
                          className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-colors ${
                            form.frequency === f
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-border text-muted-foreground hover:border-accent/50 hover:text-foreground"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Schedule Days — weekly only */}
                  {form.frequency === "weekly" && (
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">
                        Delivery Day
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {ALL_DAYS.map((day) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => selectDay(day)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                              form.scheduleDays[0] === day
                                ? "border-accent bg-accent/10 text-accent"
                                : "border-border text-muted-foreground hover:border-accent/50 hover:text-foreground"
                            }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Schedule Hour */}
                  <div>
                    <label
                      htmlFor="modal-hour"
                      className="mb-1.5 block text-sm font-medium text-foreground"
                    >
                      Delivery Time{" "}
                      <span className="font-normal text-muted-foreground">
                        ({tzName})
                      </span>
                    </label>
                    <select
                      id="modal-hour"
                      value={utcToLocalHour(form.scheduleHour, tzOffset)}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          scheduleHour: localToUtcHour(
                            Number(e.target.value),
                            tzOffset,
                          ),
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                    >
                      {HOURS.map((hour) => (
                        <option key={hour} value={hour}>
                          {formatHour(hour)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Keywords */}
                  <div>
                    <label
                      htmlFor="modal-keywords"
                      className="mb-1.5 block text-sm font-medium text-foreground"
                    >
                      Keywords{" "}
                      <span className="font-normal text-muted-foreground">
                        (comma-separated)
                      </span>
                    </label>
                    <input
                      id="modal-keywords"
                      type="text"
                      value={form.keywords}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, keywords: e.target.value }))
                      }
                      placeholder="e.g. LLM agents, function calling, RAG, tool use"
                      className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
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
