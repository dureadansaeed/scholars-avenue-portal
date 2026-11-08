import type {
  AcademicRecord, FieldReview, LanguageTest, OtherTest, StudentPreference, StudentProfile,
} from "@/types";

// SAMPLE DATA. Invented people. Covers: a rich active profile (stu-001), a
// half-finished one (stu-003), a brand-new account (stu-004) and a grade on a
// non-4.0 scale (stu-002).
const unrev: FieldReview = { status: "unverified" };
const ok = (at: string, by = "cns-1"): FieldReview => ({ status: "verified", reviewedBy: by, reviewedAt: at });

export const profiles: StudentProfile[] = [
  {
    studentId: "stu-001", fullName: "Ayesha Khan", preferredName: "Aisha", dateOfBirth: "2000-04-12",
    nationality: "Pakistan", countryOfResidence: "Pakistan", city: "Lahore", email: "ayesha.khan@example.test",
    phone: "+92 300 1234567", address: "House 14, Street 6, Lahore", passportNumber: "AB1234567",
    emergencyContact: { name: "Nadia Khan", relation: "Sister", phone: "+92 301 7654321" }, communicationLanguage: "English",
    review: {
      fullName: ok("2026-09-18"),
      dateOfBirth: unrev,
      passportNumber: { status: "correction_requested", reviewedBy: "cns-1", reviewedAt: "2026-10-28",
        note: "The number does not match the uploaded passport scan. Please re-check the last two digits." },
    },
  },
  {
    studentId: "stu-002", fullName: "Omar Siddiqui", dateOfBirth: "1999-11-02", nationality: "Bangladesh",
    countryOfResidence: "Bangladesh", city: "Dhaka", email: "omar.s@example.test", phone: "+880 1711 000111",
    communicationLanguage: "English", review: { fullName: ok("2026-10-01") },
  },
  {
    studentId: "stu-003", fullName: "Maria Costa", nationality: "Brazil", countryOfResidence: "Brazil",
    email: "maria.costa@example.test", review: {},
  },
  { studentId: "stu-004", fullName: "Tariq Ahmed", email: "tariq.a@example.test", review: {} },
  {
    studentId: "stu-005", fullName: "Hina Raza", dateOfBirth: "2001-01-20", nationality: "India",
    countryOfResidence: "India", city: "Pune", email: "hina.raza@example.test", phone: "+91 98200 55501",
    communicationLanguage: "English", review: { fullName: ok("2026-09-02", "cns-2") },
  },
  { studentId: "stu-006", fullName: "Yusuf Demir", email: "yusuf.d@example.test", review: {} },
];

export const academics: AcademicRecord[] = [
  {
    id: "ac-001", studentId: "stu-001", level: "higher_secondary", title: "FSc Pre-Engineering", major: "Pre-Engineering",
    institution: "Government College Lahore", institutionCountry: "Pakistan", institutionCity: "Lahore",
    startDate: "2016-09-01", endDate: "2018-06-30", endIsExpected: false, studyMode: "full_time",
    gradeObtained: 87, gradeScale: 100, gradeKind: "percentage", backlogs: 0, awardStatus: "awarded", review: ok("2026-09-18"),
  },
  {
    id: "ac-002", studentId: "stu-001", level: "bachelor", title: "BSc Computer Science", major: "Computer Science",
    institution: "National University of Computer Sciences", institutionCountry: "Pakistan", institutionCity: "Lahore",
    startDate: "2018-09-01", endDate: "2022-06-30", endIsExpected: false, studyMode: "full_time",
    gradeObtained: 3.4, gradeScale: 4.0, gradeKind: "cgpa", classOrRank: "First class", creditsTotal: 136, creditsCompleted: 136,
    thesisTitle: "Federated learning for low-resource devices", backlogs: 1,
    gapNote: "Twelve months working as a software engineer after graduation.", awardStatus: "awarded", review: unrev,
  },
  {
    id: "ac-003", studentId: "stu-002", level: "bachelor", title: "BSc Electrical Engineering", major: "Electrical Engineering",
    institution: "Dhaka Institute of Technology", institutionCountry: "Bangladesh", institutionCity: "Dhaka",
    startDate: "2017-02-01", endDate: "2021-12-31", endIsExpected: false,
    // 3.4 out of 5.0: must never be read as 3.4/4.0.
    gradeObtained: 3.4, gradeScale: 5.0, gradeKind: "cgpa", backlogs: 0, awardStatus: "awarded", review: unrev,
  },
  {
    id: "ac-004", studentId: "stu-003", level: "bachelor", title: "BSc Mechanical Engineering", major: "Mechanical Engineering",
    institution: "Universidade Federal Exemplo", institutionCountry: "Brazil",
    endDate: "2026-12-15", endIsExpected: true, gradeObtained: null, gradeScale: null, gradeKind: "cgpa",
    backlogs: null, awardStatus: "in_progress", review: unrev,
  },
  {
    id: "ac-005", studentId: "stu-005", level: "bachelor", title: "BTech Information Technology", major: "Information Technology",
    institution: "Pune Institute of Engineering", institutionCountry: "India", institutionCity: "Pune",
    startDate: "2018-08-01", endDate: "2022-05-31", endIsExpected: false, gradeObtained: 8.1, gradeScale: 10, gradeKind: "cgpa",
    backlogs: 0, awardStatus: "awarded", review: ok("2026-09-10", "cns-2"),
  },
];

export const languageTests: LanguageTest[] = [
  {
    id: "lt-001", studentId: "stu-001", type: "ielts_academic", testDate: "2026-03-14", overall: 7.0, maxScore: 9,
    components: { listening: 7.5, reading: 7.0, writing: 6.5, speaking: 6.5 }, reportRef: "IELTS-0000-SAMPLE",
    expiresOn: "2028-03-14", documentId: "doc-006", review: unrev,
  },
  {
    id: "lt-002", studentId: "stu-002", type: "ielts_academic", testDate: "2024-12-02", overall: 6.5, maxScore: 9,
    components: { listening: 6.5, reading: 6.5, writing: 6.0, speaking: 6.5 }, expiresOn: "2026-12-02", review: unrev,
  },
  {
    id: "lt-003", studentId: "stu-005", type: "toefl_ibt", testDate: "2026-06-20", overall: 96, maxScore: 120,
    components: { listening: 25, reading: 25, writing: 23, speaking: 23 }, expiresOn: "2028-06-20", review: ok("2026-09-10", "cns-2"),
  },
];

export const otherTests: OtherTest[] = [
  { id: "ot-001", studentId: "stu-005", type: "gre", testDate: "2026-05-10", score: 322, maxScore: 340, expiresOn: "2031-05-10", review: unrev },
];

export const preferences: StudentPreference[] = [
  { studentId: "stu-001", countries: ["DE", "NL", "SE"], degreeLevels: ["master"], subjects: ["Computer Science", "Data Science"],
    intake: "Winter 2027", studyMode: "full_time", cities: ["Berlin"], tuitionMax: { amount: 8000, currency: "EUR" }, scholarshipInterest: true },
  { studentId: "stu-002", countries: ["DE", "FI"], degreeLevels: ["master"], subjects: ["Electrical Engineering"], intake: "Winter 2027",
    studyMode: "full_time", cities: [], scholarshipInterest: true },
  { studentId: "stu-003", countries: [], degreeLevels: [], subjects: [], cities: [], scholarshipInterest: false },
  { studentId: "stu-005", countries: ["US", "GB"], degreeLevels: ["master"], subjects: ["Computer Science"], intake: "Fall 2027",
    studyMode: "full_time", cities: [], scholarshipInterest: false },
];
