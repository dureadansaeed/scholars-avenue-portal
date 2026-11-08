import { formatDate } from "@/lib/clock";
import type { Program, ProgramIntake, Req } from "@/types";

export interface FactRow { label: string; value: string; unknown?: boolean }

const unknownRow = (label: string): FactRow => ({ label, value: "Not confirmed yet", unknown: true });

function fromReq<T>(label: string, r: Req<T>, show: (v: T) => string): FactRow {
  if (r.status === "unknown") return unknownRow(label);
  if (r.status === "not_required") return { label, value: "Not required" };
  return { label, value: show(r.value) };
}

const TEST = (t: string) => t.replace(/_/g, " ").toUpperCase().replace("IELTS ACADEMIC", "IELTS Academic").replace("TOEFL IBT", "TOEFL iBT");

/** Unknown stays unknown: never rendered as zero, "none" or "open" (PRD 7.6.4, 13). */
export function requirementRows(p: Pick<Program, "requirements">): FactRow[] {
  const r = p.requirements;
  return [
    fromReq("Previous qualification", r.previousQualification, (v) => ({ higher_secondary: "Higher secondary", bachelor: "Bachelor's degree", master: "Master's degree", phd: "PhD" })[v]),
    fromReq("Minimum grade", r.minGrade, (v) => `${v.value} out of ${v.scale}`),
    fromReq("Language test", r.languageTests, (v) => v.map((t) => {
      const comps = Object.entries(t.components).map(([k, n]) => `${k} ${n}`).join(", ");
      return `${TEST(t.testType)} ${t.overall ?? "(minimum not confirmed)"}${comps ? ` (${comps})` : ""}`;
    }).join(" or ")),
    fromReq("Other tests", r.otherTests, (v) => v.map((t) => t.toUpperCase()).join(", ")),
    fromReq("Work experience", r.workExperienceMonths, (v) => `${v} months`),
  ];
}

export function deadlineText(i: Pick<ProgramIntake, "deadline">): FactRow {
  const d = i.deadline;
  if (d.kind === "fixed") return { label: "Application deadline", value: formatDate(d.date) };
  if (d.kind === "rolling") return { label: "Application deadline", value: "Rolling admissions. Confirm availability with your counselor." };
  return { label: "Application deadline", value: "Not published yet. We will confirm it; do not assume it is open.", unknown: true };
}

export const money = (m: { amount: number; currency: string } | null | undefined) =>
  m ? new Intl.NumberFormat("en-GB", { style: "currency", currency: m.currency, maximumFractionDigits: 0 }).format(m.amount) : null;
