import type { ApplicationStatus } from "@/types";

/**
 * Report definitions (PRD 7.14). Every number states how it is counted, and
 * pending applications are always kept apart from ones with a final outcome.
 */
export const FINAL: ApplicationStatus[] = ["offer_accepted", "offer_declined", "rejected", "withdrawn", "closed"];
export const OFFER: ApplicationStatus[] = ["offer_received", "conditional_offer_received", "offer_accepted", "offer_declined"];
export const isFinal = (s: ApplicationStatus) => FINAL.includes(s);

export interface BreakdownRow { key: string; label: string; total: number; pending: number; final: number }

export function breakdown<T extends { status: ApplicationStatus }>(items: T[], key: (t: T) => string, label: (k: string) => string): BreakdownRow[] {
  const m = new Map<string, BreakdownRow>();
  for (const it of items) {
    const k = key(it) || "unknown";
    const row = m.get(k) ?? { key: k, label: k === "unknown" ? "Not recorded" : label(k), total: 0, pending: 0, final: 0 };
    row.total++;
    if (isFinal(it.status)) row.final++; else row.pending++;
    m.set(k, row);
  }
  return [...m.values()].sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
}

/** Inclusive date window on an ISO date; an empty bound is open. Items with no date are excluded once a bound is set. */
export function inWindow(date: string | null | undefined, from: string, to: string) {
  if (!from && !to) return true;
  if (!date) return false;
  const d = date.slice(0, 10);
  return (!from || d >= from) && (!to || d <= to);
}

export function outcomes(statuses: ApplicationStatus[]) {
  return {
    offers: statuses.filter((s) => OFFER.includes(s)).length,
    accepted: statuses.filter((s) => s === "offer_accepted").length,
    rejected: statuses.filter((s) => s === "rejected").length,
    withdrawn: statuses.filter((s) => s === "withdrawn").length,
    pending: statuses.filter((s) => !isFinal(s)).length,
  };
}
