/**
 * The mock world's "now". Fixed so server-rendered output is deterministic
 * (and so Cache Components never sees a bare `new Date()`); every mock date is
 * written relative to this. Replace with a real clock when a backend exists.
 */
export const DEMO_NOW = "2026-11-02T09:00:00Z";

export const nowMs = () => Date.parse(DEMO_NOW);

export function daysUntil(iso: string, from: string = DEMO_NOW): number {
  return Math.ceil((Date.parse(iso) - Date.parse(from)) / 86_400_000);
}

export function isPast(iso: string, from: string = DEMO_NOW): boolean {
  return Date.parse(iso) < Date.parse(from);
}

const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const fmtTime = new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short",
});

/** Dates always carry the year (PRD 11.5). */
export const formatDate = (iso: string) => fmt.format(new Date(iso));
export const formatDateTime = (iso: string) => fmtTime.format(new Date(iso));

export function relativeDays(iso: string): string {
  const d = daysUntil(iso);
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  if (d === -1) return "yesterday";
  return d > 0 ? `in ${d} days` : `${-d} days ago`;
}
