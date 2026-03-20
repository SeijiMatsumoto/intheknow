"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

type Sources = {
  rss?: string[];
  twitter_queries?: string[];
  sites?: string[];
};

type NewsletterFormProps = {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: {
    title?: string;
    slug?: string;
    description?: string;
    frequency?: string;
    scheduleDays?: string[];
    scheduleHour?: number;
    keywords?: string[];
    sources?: Sources;
  };
};

export function NewsletterForm({
  action,
  defaultValues: d = {},
}: NewsletterFormProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const sources = d.sources ?? {};
  const scheduleDays = d.scheduleDays ?? [];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => action(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Title" name="title" defaultValue={d.title} required />
        <Field
          label="Slug"
          name="slug"
          defaultValue={d.slug}
          placeholder="auto-generated if empty"
        />
      </div>

      <Field
        label="Description"
        name="description"
        defaultValue={d.description ?? ""}
        multiline
        rows={2}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="frequency"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Frequency
          </label>
          <select
            id="frequency"
            name="frequency"
            defaultValue={d.frequency ?? "weekly"}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="daily">daily</option>
            <option value="weekly">weekly</option>
          </select>
        </div>
        <Field
          label="Keywords (comma-separated)"
          name="keywords"
          defaultValue={d.keywords?.join(", ") ?? ""}
          placeholder="e.g. AI, LLMs, OpenAI"
        />
      </div>

      <Field
        label="RSS Feeds (one per line)"
        name="rss"
        defaultValue={sources.rss?.join("\n") ?? ""}
        multiline
        rows={4}
        placeholder="https://example.com/feed.xml"
      />
      <Field
        label="Sites to monitor (one per line)"
        name="sites"
        defaultValue={sources.sites?.join("\n") ?? ""}
        multiline
        rows={3}
        placeholder="https://techcrunch.com"
      />
      <Field
        label="Twitter / X search queries (one per line)"
        name="twitter_queries"
        defaultValue={sources.twitter_queries?.join("\n") ?? ""}
        multiline
        rows={3}
        placeholder="from:OpenAI OR #AI"
      />

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Send on (UTC)
        </p>
        <div className="flex flex-wrap gap-3">
          {DAYS.map((day) => (
            <label
              key={day}
              className="flex items-center gap-1.5 text-sm capitalize"
            >
              <input
                type="checkbox"
                name="scheduleDays"
                value={day}
                defaultChecked={scheduleDays.includes(day)}
              />
              {day.slice(0, 3)}
            </label>
          ))}
        </div>
      </div>

      <div className="w-40">
        <label
          htmlFor="scheduleHour"
          className="mb-1 block text-xs font-medium text-muted-foreground"
        >
          Hour (UTC, 0–23)
        </label>
        <input
          id="scheduleHour"
          type="number"
          name="scheduleHour"
          min={0}
          max={23}
          defaultValue={d.scheduleHour ?? 8}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button type="button" onClick={() => router.back()} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

type FieldProps = {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
};

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required,
  multiline,
  rows = 3,
}: FieldProps) {
  const baseClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring";
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1 block text-xs font-medium text-muted-foreground"
      >
        {label}
      </label>
      {multiline ? (
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          rows={rows}
          className={baseClass}
        />
      ) : (
        <input
          id={name}
          type="text"
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          required={required}
          className={baseClass}
        />
      )}
    </div>
  );
}
