import type {
  AcademicRecord, Application, CaseStatus, LanguageTest, StudentCase, StudentDocument, StudentPreference, StudentProfile, Task, User,
} from "@/types";
import { applications, cases } from "./cases";
import { academics, languageTests, otherTests, preferences, profiles } from "./students";
import { documents, tasks } from "./workflow";
import { ORG_ID, students } from "./users";

/**
 * The whole mock organisation: the six hand-written students plus 24 generated
 * ones, so lists, filters and pagination have something to work on.
 * SAMPLE DATA. Generation is deterministic (index arithmetic, no randomness) so
 * server renders are stable.
 */
const NAMES = [
  "Aaliyah Rahman", "Bilal Chaudhry", "Chloe Martin", "Dev Malhotra", "Elena Popescu", "Farid Haddad", "Grace Okoye", "Hamza Iqbal",
  "Ines Moreau", "Jamal Warsi", "Kavya Reddy", "Luca Ferrari", "Mina Takeda", "Noor Fatima", "Olivia Hart", "Pavel Novak",
  "Qasim Ali", "Rhea Kapoor", "Samir Nasser", "Tessa Lindqvist", "Usman Farooq", "Vera Horvath", "Wen Li", "Zainab Sheikh",
];
const COUNTRIES = ["DE", "NL", "SE", "GB", "US", "FI", "CZ", "AU"];
const NATIONALITIES = ["Pakistan", "India", "Bangladesh", "Nigeria", "Egypt", "Brazil", "Vietnam", "Turkey"];
const STATUSES: CaseStatus[] = ["active", "documents_pending", "profile_incomplete", "under_counselor_review", "waiting_for_student", "waiting_for_counselor", "active", "on_hold"];
const PACKAGES = ["pkg-essential", "pkg-premium", "pkg-elite"];
const DOC_CYCLE: StudentDocument["status"][] = ["verified", "uploaded", "requested", "rejected", "under_review"];
const APP_STATUSES: Application["status"][] = ["documents_pending_student", "submitted", "under_university_review", "preparation_in_progress", "offer_received"];
const PROGRAMS = ["prg-de-cs", "prg-nl-ds", "prg-gb-comp", "prg-fi-cs", "prg-se-ml"];

const users: User[] = [];
const genProfiles: StudentProfile[] = [];
const genAcademics: AcademicRecord[] = [];
const genTests: LanguageTest[] = [];
const genPrefs: StudentPreference[] = [];
const genCases: StudentCase[] = [];
const genDocs: StudentDocument[] = [];
const genTasks: Task[] = [];
const genApps: Application[] = [];

NAMES.forEach((name, n) => {
  const i = n + 7; // continues after stu-006
  const id = `stu-${String(i).padStart(3, "0")}`;
  const email = `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.test`;
  const counselorId = i <= 16 ? "cns-1" : i <= 24 ? "cns-2" : i <= 28 ? "cns-3" : null;
  const country = COUNTRIES[i % COUNTRIES.length];
  const status: CaseStatus = counselorId ? STATUSES[i % STATUSES.length] : i === 29 ? "registration_pending" : "invited";
  const filled = counselorId ? i % 3 : 0; // 0 = sparse, 1 = partial, 2 = full

  users.push({ id, orgId: ORG_ID, role: "student", name, email, active: true });
  genProfiles.push({
    studentId: id, fullName: name, email,
    nationality: filled >= 1 ? NATIONALITIES[i % NATIONALITIES.length] : undefined,
    countryOfResidence: filled >= 1 ? NATIONALITIES[i % NATIONALITIES.length] : undefined,
    city: filled === 2 ? "Capital City" : undefined, dateOfBirth: filled === 2 ? `199${i % 10}-0${(i % 9) + 1}-1${i % 9}` : undefined,
    phone: filled >= 1 ? `+${40 + (i % 50)} 555 01${String(i).padStart(2, "0")}` : undefined,
    review: filled === 2 ? { fullName: { status: "verified", reviewedBy: counselorId!, reviewedAt: "2026-10-12" } } : {},
  });

  if (counselorId && i % 6 !== 0) {
    const scale = [4, 5, 10, 100][i % 4];
    const raw = scale * (0.62 + (i % 5) * 0.07);
    genAcademics.push({
      id: `ac-g${i}`, studentId: id, level: "bachelor", title: "BSc " + ["Computer Science", "Engineering", "Business Analytics"][i % 3],
      major: "General", institution: "Sample State University", institutionCountry: NATIONALITIES[i % NATIONALITIES.length],
      endDate: "2025-06-30", endIsExpected: false, gradeObtained: scale === 100 ? Math.round(raw) : Math.round(raw * 10) / 10,
      gradeScale: scale, gradeKind: scale === 100 ? "percentage" : "cgpa", backlogs: i % 5 === 0 ? 2 : 0, awardStatus: "awarded",
      review: i % 3 === 0 ? { status: "verified", reviewedBy: counselorId, reviewedAt: "2026-10-14" } : { status: "unverified" },
    });
  }
  if (counselorId && i % 4 !== 0) {
    genTests.push({
      id: `lt-g${i}`, studentId: id, type: "ielts_academic", testDate: "2025-11-20", overall: 6 + (i % 4) * 0.5, maxScore: 9,
      components: { listening: 6 + (i % 3) * 0.5, reading: 6, writing: 6, speaking: 6 },
      expiresOn: i % 7 === 0 ? "2026-09-30" : i % 5 === 0 ? "2026-12-15" : "2027-11-20",
      review: { status: "unverified" },
    });
  }
  genPrefs.push({
    studentId: id, countries: filled >= 1 ? [country, COUNTRIES[(i + 3) % COUNTRIES.length]] : [], degreeLevels: filled >= 1 ? ["master"] : [],
    subjects: filled === 2 ? ["Computer Science"] : [], intake: filled === 2 ? "Winter 2027" : undefined, cities: [], scholarshipInterest: i % 2 === 0,
  });
  genCases.push({
    id: `case-g${i}`, studentId: id, packageId: PACKAGES[i % 3], countries: filled >= 1 ? [country] : [], degreeLevels: filled >= 1 ? ["master"] : [],
    intake: "Winter 2027", createdAt: `2026-0${(i % 3) + 8}-1${i % 9}`, activatedAt: counselorId ? `2026-0${(i % 3) + 8}-2${i % 8}` : null,
    paymentConfirmed: !!counselorId, counselorId, status,
    internalNote: i % 8 === 0 ? "Parents involved in decisions; copy them on updates." : undefined,
  });

  if (counselorId) {
    [["passport", "Passport"], ["cv", "CV"], ["bachelor_certificate", "Bachelor's certificate and transcript"]].forEach(([cat, title], k) => {
      const st = DOC_CYCLE[(i + k) % DOC_CYCLE.length];
      genDocs.push({
        id: `doc-g${i}-${k}`, studentId: id, category: cat as StudentDocument["category"], title, status: st, required: true,
        dueDate: st === "requested" ? "2026-11-14" : undefined, requestedBy: counselorId,
        reason: st === "rejected" ? "The scan is blurry. Please upload a clear, full-page copy." : undefined,
        reviewedBy: st === "rejected" || st === "verified" ? counselorId : undefined, reviewedAt: st === "rejected" || st === "verified" ? "2026-10-24" : undefined,
        versions: st === "requested" ? [] : [{ version: 1, filename: `${cat}.pdf`, mime: "application/pdf", sizeBytes: 600_000 + i * 1000, uploadedAt: `2026-10-${10 + (i % 15)}`, uploadedBy: id }],
      });
    });
    genTasks.push({
      id: `tsk-g${i}`, studentId: id, title: ["Upload your updated CV", "Send your final transcript", "Confirm your intake"][i % 3], ownerId: id,
      kind: "student_action", status: "open", priority: "normal", category: "document",
      dueDate: i % 4 === 0 ? `2026-10-2${i % 8}` : `2026-11-${10 + (i % 15)}`, dueDateOnly: true, createdBy: counselorId,
    });
    if (i % 3 === 0) {
      genTasks.push({
        id: `tsk-gi${i}`, studentId: id, title: `Review shortlist for ${name.split(" ")[0]}`, ownerId: counselorId, kind: "internal", status: "open",
        priority: "normal", category: "internal_review", dueDate: i % 2 === 0 ? "2026-10-30" : `2026-11-0${(i % 6) + 3}`, dueDateOnly: true, createdBy: counselorId,
      });
    }
  }
  if (counselorId && i % 3 === 1) {
    const programId = PROGRAMS[i % PROGRAMS.length];
    genApps.push({
      id: `app-g${i}`, studentId: id, caseId: `case-g${i}`, programId, intakeId: `${programId}-in1`, counselorId,
      status: APP_STATUSES[i % APP_STATUSES.length], studentStatusLabel: "In progress", route: "direct_portal", startedAt: "2026-10-05",
      history: [{ from: null, to: "planned", at: "2026-10-05", by: counselorId }],
    });
  }
});

export const world = {
  students: [...students, ...users],
  profiles: [...profiles, ...genProfiles],
  academics: [...academics, ...genAcademics],
  languageTests: [...languageTests, ...genTests],
  otherTests,
  preferences: [...preferences, ...genPrefs],
  cases: [...cases, ...genCases],
  documents: [...documents, ...genDocs],
  tasks: [...tasks, ...genTasks],
  applications: [...applications, ...genApps],
};
