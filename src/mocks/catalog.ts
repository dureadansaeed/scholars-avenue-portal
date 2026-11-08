import type {
  City, DegreeLevel, LanguageRequirement, Program, ProgramIntake, Req, SourceRef, University,
} from "@/types";

// SAMPLE DATA. Every university, programme, requirement, deadline and fee below
// is invented for UI development. None of it is verified fact (PRD 17, 18).
const src = (verification: SourceRef["verification"], checked: string | null, url: string | null = null): SourceRef => ({
  verification, lastCheckedAt: checked, url,
});

export const cities: City[] = [
  ["ber", "DE", "Berlin", "Europe/Berlin"], ["muc", "DE", "Munich", "Europe/Berlin"],
  ["mil", "IT", "Milan", "Europe/Rome"], ["par", "FR", "Paris", "Europe/Paris"],
  ["ams", "NL", "Amsterdam", "Europe/Amsterdam"], ["lon", "GB", "London", "Europe/London"],
  ["bos", "US", "Boston", "America/New_York"], ["syd", "AU", "Sydney", "Australia/Sydney"],
  ["sto", "SE", "Stockholm", "Europe/Stockholm"], ["hel", "FI", "Helsinki", "Europe/Helsinki"],
  ["bud", "HU", "Budapest", "Europe/Budapest"], ["buc", "RO", "Bucharest", "Europe/Bucharest"],
  ["pra", "CZ", "Prague", "Europe/Prague"],
].map(([id, countryCode, name, timezone]) => ({
  id: `city-${id}`, countryCode, name, timezone, source: src("pending_review", null),
}));

const uni = (id: string, countryCode: string, city: string, name: string, type: University["type"],
  status: University["status"] = "pending_review", checked: string | null = null): University => ({
  id: `uni-${id}`, countryCode, cityIds: [`city-${city}`], name, abbreviations: [], type,
  website: null, admissionsUrl: null, status, source: src(status, checked),
});

export const universities: University[] = [
  uni("ber", "DE", "ber", "Spreeland Technical University", "public", "verified", "2026-09-20"),
  uni("muc", "DE", "muc", "Isarbrück University of Applied Sciences", "public"),
  uni("mil", "IT", "mil", "Politecnico Lombardia", "public"),
  uni("par", "FR", "par", "Université Seine-Nord", "public"),
  uni("ams", "NL", "ams", "Amstelburg University", "public", "verified", "2026-10-05"),
  uni("lon", "GB", "lon", "Thameside College London", "public"),
  uni("bos", "US", "bos", "Charles River Institute", "private"),
  uni("syd", "AU", "syd", "Harbourview University", "public"),
  uni("sto", "SE", "sto", "Nordhaven Institute of Technology", "public", "verified", "2026-08-30"),
  uni("hel", "FI", "hel", "Helsinki Northern University", "public"),
  uni("bud", "HU", "bud", "Danubia University", "public"),
  uni("buc", "RO", "buc", "Carpathia Polytechnic", "public"),
  uni("pra", "CZ", "pra", "Vltava Technical University", "public"),
];

type Intake = Pick<ProgramIntake, "name" | "year" | "deadline"> & Partial<ProgramIntake>;
const intake = (pid: string, i: number, v: Intake): ProgramIntake => ({
  id: `${pid}-in${i}`, opensOn: null, route: null, applicationFee: null, tuition: null, ...v,
});
const fixed = (date: string, type: "university" | "uni_assist" = "university") =>
  ({ kind: "fixed", date, type, dateOnly: true }) as const;
const lt = (testType: LanguageRequirement["testType"], overall: number | null,
  components: LanguageRequirement["components"] = {}): LanguageRequirement => ({ testType, overall, components });
const need = <T,>(value: T): Req<T> => ({ status: "required", value });
const unknown: Req<never> = { status: "unknown" };
const none: Req<never> = { status: "not_required" };

interface P {
  slug: string; country: string; city: string; uni: string; name: string; title: string; subject: string;
  level?: DegreeLevel; tags?: string[]; lang?: string[]; months?: number | null;
  intakes: Intake[]; req: Partial<Program["requirements"]>;
  status?: Program["status"]; checked?: string | null; scholarship?: boolean | null;
  counselorNote?: string; studentNote?: string;
}
const prog = (p: P): Program => {
  const id = `prg-${p.slug}`;
  const status = p.status ?? "pending_review";
  return {
    id, universityId: `uni-${p.uni}`, countryCode: p.country, cityId: `city-${p.city}`, name: p.name,
    degreeLevel: p.level ?? "master", degreeTitle: p.title, subject: p.subject, tags: p.tags ?? [],
    languageOfInstruction: p.lang ?? ["English"], studyMode: "full_time", durationMonths: p.months ?? 24,
    intakes: p.intakes.map((v, i) => intake(id, i + 1, v)),
    requirements: {
      previousQualification: unknown, minGrade: unknown, languageTests: unknown, otherTests: unknown,
      workExperienceMonths: unknown, ...p.req,
    },
    scholarshipAvailable: p.scholarship ?? null, counselorNote: p.counselorNote, studentNote: p.studentNote,
    status, source: src(status, p.checked ?? null, status === "verified" ? "https://example.test/official-programme-page" : null),
    sample: true,
  };
};

const eurTuition = (amount: number) => ({ amount, currency: "EUR", per: "semester" as const });

export const programs: Program[] = [
  prog({ slug: "de-cs", country: "DE", city: "ber", uni: "ber", name: "Computer Science", title: "MSc", subject: "Computer Science",
    tags: ["software", "systems"], status: "verified", checked: "2026-09-20", scholarship: true,
    studentNote: "Strong systems focus. Applications go through Uni-Assist.",
    counselorNote: "Check APS requirement for students from some countries (sample note).",
    intakes: [
      { name: "Winter 2027", year: 2027, deadline: fixed("2027-05-31", "uni_assist"),
        route: { type: "uni_assist", portalName: "Uni-Assist" }, applicationFee: { amount: 75, currency: "EUR" }, tuition: eurTuition(350) },
      { name: "Summer 2027", year: 2027, deadline: fixed("2026-11-30", "uni_assist"), route: { type: "uni_assist", portalName: "Uni-Assist" } },
    ],
    req: {
      previousQualification: need("bachelor"), minGrade: need({ value: 3.0, scale: 4.0 }),
      languageTests: need([lt("ielts_academic", 6.5, { listening: 6.0, reading: 6.0, writing: 6.0, speaking: 6.0 }), lt("toefl_ibt", 88)]),
      otherTests: none, workExperienceMonths: none,
    } }),
  prog({ slug: "de-de", country: "DE", city: "muc", uni: "muc", name: "Data Engineering", title: "MSc", subject: "Data Science",
    tags: ["data", "cloud"], status: "pending_review", scholarship: null,
    // Deadline and language rules intentionally unknown: shows "unknown, not open".
    intakes: [{ name: "Winter 2027", year: 2027, deadline: { kind: "not_published" } }],
    req: { previousQualification: need("bachelor"), minGrade: unknown, languageTests: unknown } }),
  prog({ slug: "de-old", country: "DE", city: "ber", uni: "ber", name: "Informatics (legacy)", title: "MSc", subject: "Computer Science",
    status: "archived", checked: "2024-02-01", intakes: [{ name: "Winter 2025", year: 2025, deadline: fixed("2025-05-31", "uni_assist") }],
    req: { previousQualification: need("bachelor"), minGrade: need({ value: 2.5, scale: 4.0 }), languageTests: need([lt("ielts_academic", 6.5)]) } }),
  prog({ slug: "it-me", country: "IT", city: "mil", uni: "mil", name: "Mechanical Engineering", title: "MSc", subject: "Mechanical Engineering",
    intakes: [{ name: "Autumn 2027", year: 2027, deadline: fixed("2027-03-15") }],
    req: { previousQualification: need("bachelor"), languageTests: need([lt("ielts_academic", 6.0)]) } }),
  prog({ slug: "fr-ai", country: "FR", city: "par", uni: "par", name: "Artificial Intelligence", title: "MSc", subject: "Computer Science",
    tags: ["ai"], intakes: [{ name: "Autumn 2027", year: 2027, deadline: fixed("2027-02-28"), route: { type: "centralized_portal", portalName: "National portal" } }],
    req: { previousQualification: need("bachelor"), minGrade: unknown, languageTests: need([lt("ielts_academic", 6.5, { writing: 6.0 })]) } }),
  prog({ slug: "nl-ds", country: "NL", city: "ams", uni: "ams", name: "Data Science", title: "MSc", subject: "Data Science",
    tags: ["data", "ai"], status: "verified", checked: "2026-10-05", scholarship: true,
    studentNote: "Selective programme; the motivation letter carries real weight.",
    intakes: [{ name: "September 2027", year: 2027, deadline: fixed("2027-04-01"),
      route: { type: "direct_portal", portalName: "University portal" }, applicationFee: { amount: 100, currency: "EUR" },
      tuition: { amount: 18500, currency: "EUR", per: "year" } }],
    req: {
      previousQualification: need("bachelor"), minGrade: need({ value: 3.2, scale: 4.0 }),
      languageTests: need([lt("ielts_academic", 7.0, { listening: 6.5, reading: 6.5, writing: 6.5, speaking: 6.5 }), lt("toefl_ibt", 100)]),
      otherTests: none, workExperienceMonths: none,
    } }),
  prog({ slug: "gb-comp", country: "GB", city: "lon", uni: "lon", name: "Computing", title: "MSc", subject: "Computer Science", months: 12,
    intakes: [{ name: "September 2027", year: 2027, deadline: { kind: "rolling" }, route: { type: "direct_portal", portalName: "University portal" } }],
    req: { previousQualification: need("bachelor"), minGrade: need({ value: 60, scale: 100 }), languageTests: need([lt("ielts_academic", 6.5, { listening: 6.0, reading: 6.0, writing: 6.0, speaking: 6.0 })]) } }),
  prog({ slug: "us-cs", country: "US", city: "bos", uni: "bos", name: "Computer Science", title: "MS", subject: "Computer Science",
    intakes: [{ name: "Fall 2027", year: 2027, deadline: fixed("2026-12-15"), applicationFee: { amount: 90, currency: "USD" } }],
    req: { previousQualification: need("bachelor"), minGrade: need({ value: 3.3, scale: 4.0 }), languageTests: need([lt("toefl_ibt", 100), lt("ielts_academic", 7.0)]), otherTests: need(["gre"]) } }),
  prog({ slug: "au-it", country: "AU", city: "syd", uni: "syd", name: "Information Technology", title: "MIT", subject: "Computer Science",
    intakes: [{ name: "Semester 1 2027", year: 2027, deadline: fixed("2026-10-20") }],
    req: { previousQualification: need("bachelor"), languageTests: need([lt("ielts_academic", 6.5, { listening: 6.0, reading: 6.0, writing: 6.0, speaking: 6.0 })]) } }),
  prog({ slug: "se-ml", country: "SE", city: "sto", uni: "sto", name: "Machine Learning", title: "MSc", subject: "Computer Science",
    tags: ["ai"], status: "verified", checked: "2025-12-01", // verified but stale
    intakes: [{ name: "Autumn 2027", year: 2027, deadline: fixed("2027-01-15"), route: { type: "centralized_portal", portalName: "National admissions" } }],
    req: { previousQualification: need("bachelor"), minGrade: need({ value: 3.0, scale: 4.0 }), languageTests: need([lt("ielts_academic", 6.5, { writing: 5.5 }), lt("toefl_ibt", 90)]), otherTests: none } }),
  prog({ slug: "fi-cs", country: "FI", city: "hel", uni: "hel", name: "Computer Science", title: "MSc", subject: "Computer Science",
    intakes: [{ name: "Autumn 2027", year: 2027, deadline: fixed("2027-01-10") }],
    req: { previousQualification: need("bachelor"), languageTests: need([lt("ielts_academic", 6.5)]) } }),
  prog({ slug: "hu-ee", country: "HU", city: "bud", uni: "bud", name: "Electrical Engineering", title: "MSc", subject: "Electrical Engineering",
    intakes: [{ name: "Autumn 2027", year: 2027, deadline: { kind: "not_published" } }],
    req: { previousQualification: need("bachelor") } }),
  prog({ slug: "ro-cs", country: "RO", city: "buc", uni: "buc", name: "Software Engineering", title: "MSc", subject: "Computer Science",
    status: "draft", intakes: [{ name: "Autumn 2027", year: 2027, deadline: { kind: "not_published" } }], req: {} }),
  prog({ slug: "cz-cs", country: "CZ", city: "pra", uni: "pra", name: "Computer Science", title: "MSc", subject: "Computer Science",
    status: "needs_update", checked: "2025-03-01", intakes: [{ name: "Autumn 2027", year: 2027, deadline: fixed("2027-04-30") }],
    req: { previousQualification: need("bachelor"), languageTests: need([lt("ielts_academic", 6.0)]) } }),
];
