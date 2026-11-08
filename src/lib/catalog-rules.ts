import { daysUntil, DEMO_NOW } from "@/lib/clock";
import type { LanguageRequirement, Program, RecordStatus, Req } from "@/types";

/**
 * Catalog record workflow (PRD 8.3, 7.6.6). Records are archived, never deleted,
 * so historical applications keep their links (PRD-010).
 */
export const RECORD_NEXT: Record<RecordStatus, RecordStatus[]> = {
  draft: ["pending_review", "archived"],
  pending_review: ["verified", "needs_update", "draft"],
  verified: ["needs_update", "outdated", "archived"],
  needs_update: ["pending_review", "verified", "outdated"],
  outdated: ["pending_review", "archived"],
  archived: ["pending_review"],
};
export const RECORD_LABEL: Record<RecordStatus, string> = {
  draft: "Draft", pending_review: "Pending review", verified: "Verified", needs_update: "Needs update", outdated: "Outdated", archived: "Archived",
};
export const RECORD_ACTION: Record<RecordStatus, string> = {
  draft: "Send back to draft", pending_review: "Submit for review", verified: "Mark verified", needs_update: "Flag: needs update",
  outdated: "Mark outdated", archived: "Archive",
};
/** Moves that should always carry a reason in the history. */
export const RECORD_NEEDS_REASON = new Set<RecordStatus>(["needs_update", "outdated", "archived", "draft"]);

export const REVIEW_INTERVAL_DAYS = 180;

export function isStale(p: Pick<Program, "status" | "source">, now = DEMO_NOW, interval = REVIEW_INTERVAL_DAYS) {
  return p.status === "verified" && (!p.source.lastCheckedAt || daysUntil(p.source.lastCheckedAt, now) < -interval);
}

/** Whether a status move is allowed, and why not when it is not. */
export function checkRecordMove(p: Pick<Program, "status" | "source">, to: RecordStatus, reason?: string): string | null {
  if (!RECORD_NEXT[p.status].includes(to)) return `A ${RECORD_LABEL[p.status].toLowerCase()} record cannot move to ${RECORD_LABEL[to].toLowerCase()}.`;
  if (to === "verified" && !p.source.url) return "Add the official source URL before marking this verified. Requirements are only verified against an official source.";
  if (RECORD_NEEDS_REASON.has(to) && !reason?.trim()) return "Record a reason. It is kept in the change history.";
  return null;
}

/** Validation of the structured programme form. Unknown is valid; a half-filled requirement is not. */
export function validateProgram(p: Program): Record<string, string> {
  const e: Record<string, string> = {};
  if (!p.name.trim()) e.name = "Enter the official programme name.";
  if (!p.degreeTitle.trim()) e.degreeTitle = "Enter the degree title, for example MSc.";
  if (!p.universityId) e.universityId = "Choose the university.";
  if (!p.cityId) e.cityId = "Choose the campus city.";
  if (p.durationMonths != null && (!Number.isInteger(p.durationMonths) || p.durationMonths <= 0)) e.durationMonths = "Whole months above 0, or leave empty if unknown.";
  const g = p.requirements.minGrade;
  if (g.status === "required") {
    if (!(g.value.scale > 0)) e.minGradeScale = "The grade scale maximum must be above 0. It is never assumed.";
    else if (!(g.value.value >= 0) || g.value.value > g.value.scale) e.minGrade = "The minimum must be between 0 and the scale maximum.";
  }
  const l: Req<LanguageRequirement[]> = p.requirements.languageTests;
  if (l.status === "required") {
    if (l.value.length === 0) e.languageTests = "Add at least one accepted test, or set the requirement to Unknown.";
    const seen = new Set<string>();
    l.value.forEach((t, i) => {
      if (seen.has(t.testType)) e[`lang${i}`] = "This test is listed twice.";
      seen.add(t.testType);
      if (t.overall != null && t.overall < 0) e[`lang${i}`] = "Scores cannot be negative.";
    });
  }
  const w = p.requirements.workExperienceMonths;
  if (w.status === "required" && !(Number.isInteger(w.value) && w.value > 0)) e.workExperience = "Whole months above 0.";
  const o = p.requirements.otherTests;
  if (o.status === "required" && o.value.length === 0) e.otherTests = "Pick at least one test, or set the requirement to Not required or Unknown.";
  if (p.intakes.length === 0) e.intakes = "Add at least one intake. Requirements and deadlines belong to an intake.";
  p.intakes.forEach((i, n) => {
    if (!i.name.trim()) e[`intake${n}`] = "Name the intake, for example Winter 2027.";
    else if (i.deadline.kind === "fixed" && !i.deadline.date) e[`intake${n}`] = "Enter the deadline date, or choose Rolling or Not published.";
    else if (i.applicationFee && !(i.applicationFee.amount >= 0)) e[`intake${n}`] = "Fee must be 0 or more, or leave it empty if unknown.";
    else if (i.route?.portalUrl && !/^https?:\/\/\S+$/.test(i.route.portalUrl)) e[`intake${n}`] = "Portal address must start with https://";
  });
  if (p.source.url && !/^https?:\/\/\S+$/.test(p.source.url)) e.sourceUrl = "The source must be a full web address starting with https://";
  return e;
}
