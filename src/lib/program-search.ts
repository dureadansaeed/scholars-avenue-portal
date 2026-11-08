import { DEMO_NOW, daysUntil } from "@/lib/clock";
import type { Program, ProgramIntake, RecordStatus } from "@/types";

export interface BankUniversity { id: string; name: string; type: "public" | "private" | null; countryCode: string }
export interface BankCity { id: string; name: string; countryCode: string }
export interface BankData { programs: Program[]; universities: BankUniversity[]; cities: BankCity[] }

export interface BankRow {
  key: string;
  program: Program;
  intake: ProgramIntake;
  university: BankUniversity;
  city: BankCity;
}

/** One row per programme and intake: requirements and deadlines belong to the intake (PRD 7.6.5). */
export function flatten(bank: BankData): BankRow[] {
  return bank.programs.flatMap((program) => {
    const university = bank.universities.find((u) => u.id === program.universityId)!;
    const city = bank.cities.find((c) => c.id === program.cityId)!;
    return program.intakes.map((intake) => ({ key: `${program.id}|${intake.id}`, program, intake, university, city }));
  });
}

export interface BankFilters {
  q: string; country: string; degree: string; subject: string; intake: string; language: string; city: string; route: string;
  deadline: "" | "open" | "soon" | "passed" | "unknown"; verification: "" | RecordStatus; type: "" | "public" | "private";
  scholarship: "" | "yes" | "unknown"; maxTuition: string; includeArchived: boolean;
}
export const NO_FILTERS: BankFilters = {
  q: "", country: "", degree: "", subject: "", intake: "", language: "", city: "", route: "", deadline: "", verification: "",
  type: "", scholarship: "", maxTuition: "", includeArchived: false,
};

/** "Open" is only ever claimed for a fixed future date or an explicit rolling deadline. */
export function deadlineState(i: ProgramIntake, now = DEMO_NOW): "open" | "soon" | "passed" | "unknown" {
  if (i.deadline.kind === "not_published") return "unknown";
  if (i.deadline.kind === "rolling") return "open";
  const d = daysUntil(i.deadline.date, now);
  return d < 0 ? "passed" : d <= 30 ? "soon" : "open";
}

export function applyFilters(rows: BankRow[], f: BankFilters, now = DEMO_NOW): BankRow[] {
  const q = f.q.trim().toLowerCase();
  const max = f.maxTuition.trim() === "" ? null : Number(f.maxTuition);
  return rows.filter(({ program: p, intake: i, university: u, city: c }) => {
    if (!f.includeArchived && p.status === "archived") return false;
    if (q && !`${p.name} ${p.degreeTitle} ${p.subject} ${p.tags.join(" ")} ${u.name} ${c.name}`.toLowerCase().includes(q)) return false;
    if (f.country && p.countryCode !== f.country) return false;
    if (f.degree && p.degreeLevel !== f.degree) return false;
    if (f.subject && p.subject !== f.subject) return false;
    if (f.intake && i.name !== f.intake) return false;
    if (f.language && !p.languageOfInstruction.includes(f.language)) return false;
    if (f.city && c.id !== f.city) return false;
    if (f.route && i.route?.type !== f.route) return false;
    if (f.verification && p.status !== f.verification) return false;
    if (f.type && u.type !== f.type) return false;
    if (f.scholarship === "yes" && p.scholarshipAvailable !== true) return false;
    if (f.scholarship === "unknown" && p.scholarshipAvailable !== null) return false;
    if (f.deadline) {
      const s = deadlineState(i, now);
      if (f.deadline === "open" ? !(s === "open" || s === "soon") : s !== f.deadline) return false;
    }
    // A fee that is not known is kept, not dropped: missing data never rejects (MAT-007).
    if (max != null && !Number.isNaN(max) && i.tuition && i.tuition.currency === "EUR" && i.tuition.per === "year" && i.tuition.amount > max) return false;
    return true;
  });
}

/** Plain-language warnings for stale, unverified or incomplete programme records (PRD 7.6.6, 13.4). */
export function freshnessWarnings(p: Program, i: ProgramIntake, now = DEMO_NOW, intervalDays = 180): string[] {
  const out: string[] = [];
  if (p.status === "archived") out.push("This record is archived.");
  else if (p.status === "outdated") out.push("Marked outdated: do not rely on it.");
  else if (p.status === "needs_update") out.push("Marked as needing an update.");
  else if (p.status === "draft" || p.status === "pending_review") out.push("Not yet verified against the official source.");
  if (p.status === "verified" && p.source.lastCheckedAt && daysUntil(p.source.lastCheckedAt, now) < -intervalDays) out.push(`Last verified ${Math.abs(daysUntil(p.source.lastCheckedAt, now))} days ago.`);
  if (!p.source.lastCheckedAt && p.status !== "archived") out.push("Never verified.");
  const r = p.requirements;
  const unknown = [r.previousQualification, r.minGrade, r.languageTests, r.otherTests].filter((x) => x.status === "unknown").length;
  if (unknown) out.push(`${unknown} requirement${unknown > 1 ? "s" : ""} not recorded. That means unknown, not "none".`);
  if (i.deadline.kind === "not_published") out.push("Deadline not published. It is not treated as open.");
  return out;
}

export const uniq = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b));
