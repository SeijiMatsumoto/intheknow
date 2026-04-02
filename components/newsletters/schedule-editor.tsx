"use client";

import { useTransition } from "react";
import { updateSubscriptionSchedule } from "@/app/actions/subscriptions";
import {
  ALL_DAYS,
  DAY_SHORT,
  type Frequency,
  formatHour,
  localToUtcHour,
  utcToLocalHour,
} from "@/lib/date-utils";

const TZ_OFFSET = new Date().getTimezoneOffset();

type Props = {
  subscriptionId: string;
  frequency: Frequency;
  newsletterHour: number; // UTC — newsletter default
  currentDays: string[]; // user override ([] = newsletter default)
  currentHour: number | null; // user override (null = newsletter default)
  newsletterDays: string[]; // newsletter default days
  onClose: () => void;
};

export function ScheduleEditor({
  subscriptionId,
  frequency,
  newsletterHour,
  currentDays,
  currentHour,
  newsletterDays,
  onClose,
}: Props) {
  const [pending, startTransition] = useTransition();
  const isDaily = frequency === "daily";

  const defaultLocalHour = utcToLocalHour(
    currentHour ?? newsletterHour,
    TZ_OFFSET,
  );
  const defaultDays = currentDays.length > 0 ? currentDays : newsletterDays;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    // Daily newsletters: always use newsletter days (no override)
    const selectedDays = isDaily ? [] : (fd.getAll("days") as string[]);
    const localHour = Number(fd.get("hour"));
    const utcHour = localToUtcHour(localHour, TZ_OFFSET);

    // If matches newsletter default, clear the override
    const daysMatchDefault =
      isDaily ||
      (selectedDays.length === newsletterDays.length &&
        newsletterDays.every((d) => selectedDays.includes(d)));
    const hourMatchesDefault = utcHour === newsletterHour;

    startTransition(async () => {
      await updateSubscriptionSchedule(
        subscriptionId,
        daysMatchDefault ? [] : selectedDays,
        hourMatchesDefault ? null : utcHour,
      );
      onClose();
    });
  }

  function handleReset() {
    startTransition(async () => {
      await updateSubscriptionSchedule(subscriptionId, [], null);
      onClose();
    });
  }

  const hasOverride = currentDays.length > 0 || currentHour !== null;

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 rounded-lg border bg-zinc-50 p-4 space-y-4"
    >
      {isDaily ? (
        <p className="text-xs text-zinc-400">
          This is a daily newsletter — it arrives every day. You can change the
          time below.
        </p>
      ) : (
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500">Day</p>
          <div className="flex flex-wrap gap-2">
            {ALL_DAYS.map((day) => (
              <label
                key={day}
                className="flex cursor-pointer items-center gap-1.5 rounded-md border bg-white px-2.5 py-1.5 text-xs has-[:checked]:border-zinc-800 has-[:checked]:bg-zinc-800 has-[:checked]:text-white"
              >
                <input
                  type="checkbox"
                  name="days"
                  value={day}
                  defaultChecked={defaultDays.includes(day)}
                  className="sr-only"
                />
                {DAY_SHORT[day]}
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-medium text-zinc-500">
          Time (your local time)
        </p>
        <select
          name="hour"
          defaultValue={defaultLocalHour}
          className="rounded-md border border-input bg-white px-3 py-1.5 text-sm"
        >
          {([...Array(24).keys()] as number[]).map((hour) => (
            <option key={hour} value={hour}>
              {formatHour(hour)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {hasOverride && (
          <button
            type="button"
            onClick={handleReset}
            disabled={pending}
            className="rounded-md border px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100 disabled:opacity-50"
          >
            Reset to default
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-600"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
