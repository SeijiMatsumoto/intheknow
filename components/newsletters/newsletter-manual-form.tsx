"use client";

import { CATEGORIES } from "@/lib/categories";
import {
  ALL_DAYS,
  formatHour,
  localToUtcHour,
  utcToLocalHour,
} from "@/lib/date-utils";

const HOURS = [...Array(24).keys()] as number[];

export type NewsletterFormState = {
  title: string;
  description: string;
  categoryId: string;
  frequency: "daily" | "weekly";
  scheduleDays: string[];
  scheduleHour: number;
  keywords: string;
};

type Props = {
  form: NewsletterFormState;
  onChange: (
    updater: (prev: NewsletterFormState) => NewsletterFormState,
  ) => void;
  tzOffset: number;
  tzName: string;
  error: string | null;
};

export function NewsletterManualForm({
  form,
  onChange,
  tzOffset,
  tzName,
  error,
}: Props) {
  return (
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
          onChange={(e) => onChange((f) => ({ ...f, title: e.target.value }))}
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
            onChange((f) => ({ ...f, description: e.target.value }))
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
            onChange((f) => ({ ...f, categoryId: e.target.value }))
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
        <p className="mb-1.5 text-sm font-medium text-foreground">Frequency</p>
        <div className="flex gap-3">
          {(["daily", "weekly"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() =>
                onChange((s) => ({
                  ...s,
                  frequency: f,
                  scheduleDays:
                    f === "daily"
                      ? [...ALL_DAYS]
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
                onClick={() => onChange((f) => ({ ...f, scheduleDays: [day] }))}
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
          <span className="font-normal text-muted-foreground">({tzName})</span>
        </label>
        <select
          id="modal-hour"
          value={utcToLocalHour(form.scheduleHour, tzOffset)}
          onChange={(e) =>
            onChange((f) => ({
              ...f,
              scheduleHour: localToUtcHour(Number(e.target.value), tzOffset),
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
            onChange((f) => ({ ...f, keywords: e.target.value }))
          }
          placeholder="e.g. LLM agents, function calling, RAG, tool use"
          className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
