import { DEMO_NOW } from "@/lib/clock";
import type { FieldReview, StudentProfile } from "@/types";

export const PERSONAL_KEYS = [
  "fullName", "preferredName", "dateOfBirth", "nationality", "countryOfResidence", "city",
  "phone", "phoneSecondary", "address", "passportNumber", "communicationLanguage",
] as const;
export type PersonalKey = (typeof PERSONAL_KEYS)[number];
export type PersonalDraft = Record<PersonalKey, string> & { ecName: string; ecRelation: string; ecPhone: string };

export const toDraft = (p: StudentProfile): PersonalDraft => ({
  ...(Object.fromEntries(PERSONAL_KEYS.map((k) => [k, (p[k] as string | undefined) ?? ""])) as Record<PersonalKey, string>),
  ecName: p.emergencyContact?.name ?? "", ecRelation: p.emergencyContact?.relation ?? "", ecPhone: p.emergencyContact?.phone ?? "",
});

/**
 * Editing a verified field never overwrites silently: the previous value is
 * kept in history and the field goes back to "not yet reviewed" (STU-013/014).
 * Editing a field with a requested correction counts as the student's reply.
 */
export function reviewAfterEdit(prev: FieldReview | undefined, oldValue: string, changed: boolean): FieldReview | undefined {
  if (!changed || !prev) return prev;
  if (prev.status === "unverified" && !prev.previousValues) return prev;
  const keep = prev.status === "verified" || prev.status === "correction_requested";
  return {
    status: "unverified",
    previousValues: keep && oldValue ? [...(prev.previousValues ?? []), { value: oldValue, changedAt: DEMO_NOW }] : prev.previousValues,
  };
}

export function applyPersonal(prev: StudentProfile, d: PersonalDraft): StudentProfile {
  const next: StudentProfile = { ...prev, review: { ...prev.review } };
  for (const k of PERSONAL_KEYS) {
    const before = (prev[k] as string | undefined) ?? "";
    const after = d[k].trim();
    (next as unknown as Record<string, unknown>)[k] = after === "" ? undefined : after;
    const r = reviewAfterEdit(prev.review[k], before, before !== after);
    if (r) next.review[k] = r;
  }
  next.emergencyContact = d.ecName || d.ecPhone ? { name: d.ecName.trim(), relation: d.ecRelation.trim(), phone: d.ecPhone.trim() } : undefined;
  return next;
}

export function validatePersonal(d: PersonalDraft): Partial<Record<keyof PersonalDraft, string>> {
  const e: Partial<Record<keyof PersonalDraft, string>> = {};
  if (!d.fullName.trim()) e.fullName = "Enter your full legal name as it appears on your passport.";
  if (d.dateOfBirth) {
    const t = Date.parse(d.dateOfBirth);
    if (Number.isNaN(t)) e.dateOfBirth = "Enter a valid date.";
    else if (t > Date.parse(DEMO_NOW)) e.dateOfBirth = "Date of birth cannot be in the future.";
    else if (t < Date.parse("1940-01-01")) e.dateOfBirth = "Check the year; this looks too early.";
  }
  const phone = /^\+?[0-9 ()-]{7,20}$/;
  if (d.phone && !phone.test(d.phone)) e.phone = "Use international format, for example +92 300 1234567.";
  if (d.phoneSecondary && !phone.test(d.phoneSecondary)) e.phoneSecondary = "Use international format, for example +92 300 1234567.";
  if (d.ecPhone && !phone.test(d.ecPhone)) e.ecPhone = "Use international format.";
  if ((d.ecName || d.ecPhone) && !(d.ecName && d.ecPhone)) e.ecName = "Add both a name and a phone number, or leave the contact empty.";
  if (d.passportNumber && !/^[A-Za-z0-9]{5,15}$/.test(d.passportNumber)) e.passportNumber = "Letters and numbers only, 5 to 15 characters.";
  return e;
}

export const maskSensitive = (v: string) => (v.length <= 3 ? "•".repeat(v.length) : `${"•".repeat(v.length - 3)}${v.slice(-3)}`);

export const GRADE_KIND_LABEL = { cgpa: "CGPA / GPA", percentage: "Percentage", other: "Other" } as const;
export const LEVEL_LABEL = { higher_secondary: "Higher secondary", bachelor: "Bachelor's", master: "Master's", phd: "PhD" } as const;
export const TEST_LABEL: Record<string, string> = {
  ielts_academic: "IELTS Academic", ielts_general: "IELTS General", toefl_ibt: "TOEFL iBT", pte_academic: "PTE Academic",
  cambridge: "Cambridge English", duolingo: "Duolingo English Test", testdaf: "TestDaF", goethe: "Goethe-Zertifikat", other: "Other test",
  gre: "GRE", gmat: "GMAT", sat: "SAT", act: "ACT", testas: "TestAS", german_cefr: "German (CEFR)",
};
