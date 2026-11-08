import type { City, LanguageTestType, Program, ProgramIntake, QualificationLevel, University } from "@/types";

/**
 * Spreadsheet import of programmes (PRD 7.16). The whole file is checked before
 * anything is applied; each row ends up valid, error, duplicate or conflict.
 * Only valid rows are ever imported, always as "pending review", never verified.
 * Existing catalog records are never changed by an import: a clash is a conflict
 * for a person to resolve.
 */
export type ImportField =
  | "university" | "name" | "degreeTitle" | "degreeLevel" | "subject" | "city" | "languages" | "intake" | "intakeYear" | "deadline"
  | "previousQualification" | "minGrade" | "gradeScale" | "languageTest" | "languageOverall"
  | "tuition" | "tuitionCurrency" | "tuitionPer" | "applicationFee" | "feeCurrency" | "sourceUrl";

export const IMPORT_FIELDS: { key: ImportField; label: string; required?: boolean; aliases: string[]; hint?: string }[] = [
  { key: "university", label: "University", required: true, aliases: ["university", "institution", "uni"] },
  { key: "name", label: "Programme name", required: true, aliases: ["programme", "program", "programme name", "program name", "name"] },
  { key: "degreeTitle", label: "Degree title", required: true, aliases: ["degree title", "degree", "award"], hint: "MSc, BSc, MA…" },
  { key: "degreeLevel", label: "Degree level", required: true, aliases: ["degree level", "level"], hint: "bachelor, master, phd, other" },
  { key: "intake", label: "Intake", required: true, aliases: ["intake", "semester", "intake name"], hint: "Winter 2027" },
  { key: "subject", label: "Subject", aliases: ["subject", "field", "subject area"] },
  { key: "city", label: "Campus city", aliases: ["city", "campus", "location"] },
  { key: "languages", label: "Languages of instruction", aliases: ["language of instruction", "languages", "teaching language"], hint: "Separate with ;" },
  { key: "intakeYear", label: "Intake year", aliases: ["year", "intake year"] },
  { key: "deadline", label: "Deadline", aliases: ["deadline", "application deadline"], hint: "YYYY-MM-DD, rolling, or empty if not published" },
  { key: "previousQualification", label: "Required qualification", aliases: ["required qualification", "previous qualification", "prior degree"] },
  { key: "minGrade", label: "Minimum grade", aliases: ["minimum grade", "min grade", "min gpa", "minimum gpa"] },
  { key: "gradeScale", label: "Grade scale", aliases: ["grade scale", "scale", "gpa scale", "out of"] },
  { key: "languageTest", label: "Language test", aliases: ["language test", "english test", "test"] },
  { key: "languageOverall", label: "Language minimum", aliases: ["language minimum", "test minimum", "ielts", "overall", "english minimum"] },
  { key: "tuition", label: "Tuition", aliases: ["tuition", "tuition fee", "fees"] },
  { key: "tuitionCurrency", label: "Tuition currency", aliases: ["tuition currency", "currency"] },
  { key: "tuitionPer", label: "Tuition per", aliases: ["tuition per", "per"], hint: "year, semester, programme" },
  { key: "applicationFee", label: "Application fee", aliases: ["application fee", "app fee"] },
  { key: "feeCurrency", label: "Fee currency", aliases: ["fee currency"] },
  { key: "sourceUrl", label: "Official source URL", aliases: ["source", "source url", "url", "official url", "link"] },
];

export type Mapping = Partial<Record<ImportField, number>>;
const norm = (s: string) => s.toLowerCase().replace(/[_\-]+/g, " ").replace(/\s+/g, " ").trim();

/** Guess which column holds which field from the header row. Each column is used once. */
export function autoMap(headers: string[]): Mapping {
  const m: Mapping = {};
  const used = new Set<number>();
  for (const f of IMPORT_FIELDS) {
    const i = headers.findIndex((h, n) => !used.has(n) && (f.aliases.includes(norm(h)) || norm(h) === norm(f.label)));
    if (i >= 0) { m[f.key] = i; used.add(i); }
  }
  return m;
}

export function missingRequired(m: Mapping): string[] {
  return IMPORT_FIELDS.filter((f) => f.required && m[f.key] == null).map((f) => f.label);
}

const TESTS: Record<string, LanguageTestType> = {
  "ielts": "ielts_academic", "ielts academic": "ielts_academic", "ielts general": "ielts_general", "toefl": "toefl_ibt", "toefl ibt": "toefl_ibt",
  "pte": "pte_academic", "pte academic": "pte_academic", "duolingo": "duolingo", "cambridge": "cambridge", "testdaf": "testdaf", "goethe": "goethe",
};
const LEVELS: Record<string, Program["degreeLevel"]> = { bachelor: "bachelor", "bachelor's": "bachelor", bachelors: "bachelor", master: "master", "master's": "master", masters: "master", phd: "phd", doctorate: "phd", other: "other" };
const QUALS: Record<string, QualificationLevel> = { "higher secondary": "higher_secondary", bachelor: "bachelor", "bachelor's": "bachelor", master: "master", "master's": "master", phd: "phd" };
const num = (s: string) => (s.trim() === "" ? null : Number(s.replace(/,/g, "")));
const URL_RE = /^https?:\/\/\S+$/;

export interface RowResult {
  row: number; // 1-based line number in the file, header = 1
  name: string;
  result: "valid" | "error" | "duplicate" | "conflict";
  message?: string;
  program?: Program;
}

export function validateImport(
  rows: string[][], mapping: Mapping,
  ctx: { universities: University[]; cities: City[]; programs: Program[] },
  newId: (prefix: string) => string, batchId: string,
): RowResult[] {
  const seen = new Map<string, number>();
  return rows.map((cells, i) => {
    const line = i + 2;
    const get = (k: ImportField) => (mapping[k] == null ? "" : (cells[mapping[k]!] ?? "").trim());
    const errors: string[] = [];
    const uniName = get("university");
    const uni = ctx.universities.find((u) => [u.name, ...u.abbreviations].some((n) => n.toLowerCase() === uniName.toLowerCase()));
    const label = `${get("degreeTitle")} ${get("name")}`.trim() + (uniName ? `, ${uni?.name ?? uniName}` : "");

    for (const f of IMPORT_FIELDS) if (f.required && !get(f.key)) errors.push(`${f.label} is empty.`);
    if (uniName && !uni) errors.push(`University “${uniName}” is not in the catalog. Add it first.`);
    else if (uni?.status === "archived") errors.push(`${uni.name} is archived.`);

    const level = LEVELS[get("degreeLevel").toLowerCase()];
    if (get("degreeLevel") && !level) errors.push(`Degree level “${get("degreeLevel")}” is not one of bachelor, master, phd, other.`);

    let cityId = uni?.cityIds[0] ?? "";
    if (get("city") && uni) {
      const c = ctx.cities.find((x) => x.name.toLowerCase() === get("city").toLowerCase() && x.countryCode === uni.countryCode);
      if (!c) errors.push(`City “${get("city")}” is not in the catalog for this country.`);
      else cityId = c.id;
    }

    const dl = get("deadline");
    let deadline: ProgramIntake["deadline"] = { kind: "not_published" };
    if (dl.toLowerCase() === "rolling") deadline = { kind: "rolling" };
    else if (dl) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dl) || Number.isNaN(Date.parse(dl))) errors.push(`Deadline “${dl}” is not a date (YYYY-MM-DD), “rolling”, or empty.`);
      else deadline = { kind: "fixed", date: dl, type: "university", dateOnly: true };
    }

    const g = num(get("minGrade")), sc = num(get("gradeScale"));
    let minGrade: Program["requirements"]["minGrade"] = { status: "unknown" };
    if (g != null || sc != null) {
      if (g == null || sc == null) errors.push("Minimum grade and grade scale must both be given. A scale is never assumed.");
      else if (Number.isNaN(g) || Number.isNaN(sc) || sc <= 0 || g < 0 || g > sc) errors.push(`Minimum grade ${get("minGrade")} out of ${get("gradeScale")} is not valid.`);
      else minGrade = { status: "required", value: { value: g, scale: sc } };
    }

    let languageTests: Program["requirements"]["languageTests"] = { status: "unknown" };
    const lt = get("languageTest"), lo = num(get("languageOverall"));
    if (lt || lo != null) {
      const type = TESTS[lt.toLowerCase()];
      if (!type) errors.push(lt ? `Language test “${lt}” is not recognised.` : "Language minimum given without saying which test.");
      else if (lo != null && Number.isNaN(lo)) errors.push("Language minimum is not a number.");
      else languageTests = { status: "required", value: [{ testType: type, overall: lo, components: {} }] };
    }

    const q = get("previousQualification");
    const qual = QUALS[q.toLowerCase()];
    if (q && !qual) errors.push(`Required qualification “${q}” is not recognised.`);

    const money = (amountKey: ImportField, curKey: ImportField, what: string) => {
      const a = num(get(amountKey));
      if (a == null) return null;
      const cur = get(curKey).toUpperCase() || uniCurrency(uni);
      if (Number.isNaN(a) || a < 0) { errors.push(`${what} “${get(amountKey)}” is not a number.`); return null; }
      if (!/^[A-Z]{3}$/.test(cur)) { errors.push(`${what} needs a three-letter currency.`); return null; }
      return { amount: a, currency: cur };
    };
    const tuitionMoney = money("tuition", "tuitionCurrency", "Tuition");
    const per = (get("tuitionPer").toLowerCase() || "year") as "year" | "semester" | "programme";
    if (!["year", "semester", "programme"].includes(per)) errors.push(`Tuition per “${get("tuitionPer")}” should be year, semester or programme.`);
    const fee = money("applicationFee", "feeCurrency", "Application fee");

    const src = get("sourceUrl");
    if (src && !URL_RE.test(src)) errors.push("Source URL must start with https://");
    const year = num(get("intakeYear")) ?? Number(get("intake").match(/\d{4}/)?.[0] ?? NaN);

    if (errors.length) return { row: line, name: label || `Row ${line}`, result: "error" as const, message: errors.join(" ") };

    const key = `${uni!.id}|${get("name").toLowerCase()}|${get("degreeTitle").toLowerCase()}|${get("intake").toLowerCase()}`;
    if (seen.has(key)) return { row: line, name: label, result: "duplicate" as const, message: `Same as row ${seen.get(key)}.` };
    seen.set(key, line);

    const existing = ctx.programs.find((p) => p.universityId === uni!.id && p.name.toLowerCase() === get("name").toLowerCase() && p.degreeTitle.toLowerCase() === get("degreeTitle").toLowerCase());
    if (existing) {
      const it = existing.intakes.find((x) => x.name.toLowerCase() === get("intake").toLowerCase());
      if (!it) return { row: line, name: label, result: "conflict" as const, message: "This programme is already in the catalog without this intake. Add the intake in the editor so nothing existing changes unseen." };
      const was = it.deadline.kind === "fixed" ? it.deadline.date : it.deadline.kind;
      const now = deadline.kind === "fixed" ? deadline.date : deadline.kind;
      if (was !== now) return { row: line, name: label, result: "conflict" as const, message: `Deadline differs from the catalog (${was} in the catalog, ${now} in the file). Review before applying.` };
      return { row: line, name: label, result: "duplicate" as const, message: "Already in the catalog." };
    }

    const id = newId("prg");
    const program: Program = {
      id, universityId: uni!.id, countryCode: uni!.countryCode, cityId, name: get("name"), degreeLevel: level!, degreeTitle: get("degreeTitle"),
      subject: get("subject") || get("name"), tags: [], languageOfInstruction: get("languages") ? get("languages").split(";").map((x) => x.trim()).filter(Boolean) : ["English"],
      studyMode: "full_time", durationMonths: null,
      intakes: [{
        id: `${id}-in1`, name: get("intake"), year: Number.isNaN(year) ? new Date().getUTCFullYear() : year, opensOn: null, deadline,
        route: null, applicationFee: fee, tuition: tuitionMoney ? { ...tuitionMoney, per } : null,
      }],
      requirements: {
        previousQualification: qual ? { status: "required", value: qual } : { status: "unknown" },
        minGrade, languageTests, otherTests: { status: "unknown" }, workExperienceMonths: { status: "unknown" },
      },
      scholarshipAvailable: null, status: "pending_review",
      source: { url: src || null, verification: "pending_review", lastCheckedAt: null }, sample: true, importBatchId: batchId,
    };
    return { row: line, name: label, result: "valid" as const, program };
  });
}

function uniCurrency(u?: University) {
  return ({ DE: "EUR", IT: "EUR", FR: "EUR", NL: "EUR", FI: "EUR", GB: "GBP", US: "USD", AU: "AUD", SE: "SEK", HU: "HUF", RO: "RON", CZ: "CZK" } as Record<string, string>)[u?.countryCode ?? ""] ?? "";
}

/** The template admins download: every field, one example row. */
export const SAMPLE_CSV = [
  IMPORT_FIELDS.map((f) => f.label).join(","),
  "Spreeland Technical University,Robotics,MSc,master,Winter 2027,Engineering,Berlin,English,2027,2027-05-31,bachelor,3.0,4.0,IELTS Academic,6.5,350,EUR,semester,75,EUR,https://example.test/robotics",
  "Amstelburg University,Data Science,MSc,master,September 2027,Data Science,Amsterdam,English,2027,2027-05-01,bachelor,3.2,4.0,IELTS Academic,7.0,18500,EUR,year,100,EUR,https://example.test/ds",
  "Amstelburg University,Artificial Intelligence,MSc,master,September 2027,Computer Science,Amsterdam,English,2027,rolling,,,,,,,,,,,",
  "Spreeland Technical University,Robotics,MSc,master,Winter 2027,Engineering,Berlin,English,2027,2027-05-31,bachelor,3.0,4.0,IELTS Academic,6.5,350,EUR,semester,75,EUR,https://example.test/robotics",
  "Unknown Institute,Physics,MSc,master,Autumn 2027,Physics,,English,2027,2027-03-01,,2.5,,,,,,,,,",
  "Nordhaven Institute of Technology,Machine Learning,MSc,master,Autumn 2027,Computer Science,Stockholm,English,2027,2027-02-01,,,,,,,,,,,",
].join("\n");
