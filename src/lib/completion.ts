import type {
  AcademicRecord, LanguageTest, StudentDocument, StudentPreference, StudentProfile,
} from "@/types";

export interface SectionCompletion {
  key: "personal" | "academic" | "language" | "preferences" | "documents";
  label: string;
  done: number;
  total: number;
  missing: string[];
  href: string;
}

export interface CompletionInput {
  profile: StudentProfile;
  academics: AcademicRecord[];
  languageTests: LanguageTest[];
  preference: StudentPreference | null;
  documents: StudentDocument[];
}

const PERSONAL: [keyof StudentProfile, string][] = [
  ["fullName", "Full legal name"], ["dateOfBirth", "Date of birth"], ["nationality", "Nationality"],
  ["countryOfResidence", "Country of residence"], ["city", "City"], ["phone", "Primary phone"],
];
const HANDED_IN = new Set(["uploaded", "under_review", "verified", "not_applicable"]);

export function sectionCompletion(input: CompletionInput): SectionCompletion[] {
  const { profile, academics, languageTests, preference, documents } = input;

  const personalMissing = PERSONAL.filter(([k]) => !profile[k]).map(([, l]) => l);

  // An academic record counts only with a grade AND its scale; a scale is never assumed.
  const academicOk = academics.some((a) => a.gradeObtained != null && a.gradeScale != null);
  const academicMissing = academics.length === 0
    ? ["At least one academic record"]
    : academicOk ? [] : ["Grade and grade scale on an academic record"];

  const languageOk = languageTests.some((t) => t.overall != null);
  const langMissing = languageOk ? [] : ["A language test with an overall score"];

  const prefChecks: [boolean, string][] = [
    [!!preference?.countries.length, "Target countries"], [!!preference?.degreeLevels.length, "Degree level"],
    [!!preference?.subjects.length, "Subject area"], [!!preference?.intake, "Intended intake"],
  ];
  const prefMissing = prefChecks.filter(([ok]) => !ok).map(([, l]) => l);

  const required = documents.filter((d) => d.required);
  const docMissing = required.filter((d) => !HANDED_IN.has(d.status)).map((d) => d.title);

  return [
    { key: "personal", label: "Personal details", done: PERSONAL.length - personalMissing.length, total: PERSONAL.length, missing: personalMissing, href: "/student/profile#personal" },
    { key: "academic", label: "Academic history", done: academicOk ? 1 : 0, total: 1, missing: academicMissing, href: "/student/profile#academic" },
    { key: "language", label: "Language tests", done: languageOk ? 1 : 0, total: 1, missing: langMissing, href: "/student/profile#language" },
    { key: "preferences", label: "Study preferences", done: prefChecks.length - prefMissing.length, total: prefChecks.length, missing: prefMissing, href: "/student/profile#preferences" },
    { key: "documents", label: "Required documents", done: required.length - docMissing.length, total: required.length || 1, missing: docMissing, href: "/student/documents" },
  ];
}

export function overallCompletion(sections: SectionCompletion[]): number {
  const done = sections.reduce((n, s) => n + s.done, 0);
  const total = sections.reduce((n, s) => n + s.total, 0);
  return total === 0 ? 0 : Math.round((done / total) * 100);
}
