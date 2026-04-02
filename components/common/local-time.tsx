"use client";

type Props = {
  utcHour: number;
};

function utcToLocalHour(utcHour: number): number {
  const offset = new Date().getTimezoneOffset();
  return (((utcHour - offset / 60) % 24) + 24) % 24;
}

function formatHour(h: number): string {
  if (h === 0) return "12:00am";
  if (h < 12) return `${h}:00am`;
  if (h === 12) return "12:00pm";
  return `${h - 12}:00pm`;
}

export function LocalTime({ utcHour }: Props) {
  const localHour = utcToLocalHour(utcHour);
  return <>{formatHour(localHour)}</>;
}
