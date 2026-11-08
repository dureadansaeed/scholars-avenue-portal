import type { Application, ApplicationRequirement, Assignment, PackageType, ShortlistEntry, StudentCase } from "@/types";

// SAMPLE DATA. Package names and scope are placeholders (PRD 16: to be confirmed).
export const packages: PackageType[] = [
  { id: "pkg-essential", name: "Essential", maxApplications: 3, maxCountries: 1, includes: ["Profile review", "Shortlist of 3 programmes"] },
  { id: "pkg-premium", name: "Premium", maxApplications: 8, maxCountries: 3, includes: ["Profile review", "Shortlist", "Application handling", "Document review"] },
  { id: "pkg-elite", name: "Elite", maxApplications: null, maxCountries: null, includes: ["Everything in Premium", "Scholarship support"] },
];

export const cases: StudentCase[] = [
  { id: "case-001", studentId: "stu-001", packageId: "pkg-premium", countries: ["DE", "NL", "SE"], degreeLevels: ["master"],
    intake: "Winter 2027", createdAt: "2026-08-20", activatedAt: "2026-08-22", paymentConfirmed: true, counselorId: "cns-1",
    status: "waiting_for_student",
    studentOverview: "Your profile is nearly ready. We need your motivation letter and two recommendation letters before we can prepare your applications.",
    internalNote: "Budget is tight; steer toward DAAD-eligible programmes. Do not mention to the student until discussed." },
  { id: "case-002", studentId: "stu-002", packageId: "pkg-essential", countries: ["DE", "FI"], degreeLevels: ["master"],
    intake: "Winter 2027", createdAt: "2026-09-12", activatedAt: "2026-09-14", paymentConfirmed: true, counselorId: "cns-2", status: "documents_pending" },
  { id: "case-003", studentId: "stu-003", packageId: "pkg-premium", countries: [], degreeLevels: [], createdAt: "2026-10-20",
    activatedAt: "2026-10-21", paymentConfirmed: true, counselorId: "cns-1", status: "profile_incomplete",
    studentOverview: "Welcome! Please complete your profile so your counselor can start looking at programmes with you." },
  { id: "case-004", studentId: "stu-004", packageId: "pkg-elite", countries: [], degreeLevels: [], createdAt: "2026-11-01",
    activatedAt: null, paymentConfirmed: false, counselorId: null, status: "invited" },
  { id: "case-005", studentId: "stu-005", packageId: "pkg-premium", countries: ["US", "GB"], degreeLevels: ["master"], intake: "Fall 2027",
    createdAt: "2026-07-01", activatedAt: "2026-07-03", paymentConfirmed: true, counselorId: "cns-2", sharedCounselorIds: ["cns-1"], status: "active" },
  { id: "case-006", studentId: "stu-006", packageId: "pkg-essential", countries: ["HU"], degreeLevels: ["bachelor"], createdAt: "2026-10-30",
    activatedAt: null, paymentConfirmed: false, counselorId: null, status: "registration_pending" },
];

export const assignments: Assignment[] = [
  { id: "as-1", caseId: "case-001", counselorId: "cns-3", previousCounselorId: null, assignedBy: "adm-1", assignedAt: "2026-08-23" },
  { id: "as-2", caseId: "case-001", counselorId: "cns-1", previousCounselorId: "cns-3", assignedBy: "adm-1", assignedAt: "2026-09-02",
    reason: "Counselor on extended leave; country expertise matches." },
  { id: "as-3", caseId: "case-002", counselorId: "cns-2", previousCounselorId: null, assignedBy: "adm-1", assignedAt: "2026-09-15" },
  { id: "as-4", caseId: "case-003", counselorId: "cns-1", previousCounselorId: null, assignedBy: "adm-2", assignedAt: "2026-10-22" },
  { id: "as-5", caseId: "case-005", counselorId: "cns-2", previousCounselorId: null, assignedBy: "adm-1", assignedAt: "2026-07-04" },
];

export const shortlist: ShortlistEntry[] = [
  { id: "sl-1", studentId: "stu-001", caseId: "case-001", programId: "prg-de-cs", intakeId: "prg-de-cs-in1", status: "application_created",
    reason: "Strong systems focus, grade requirement met, tuition within budget.",
    studentNote: "A strong fit for your software background. Tuition is a low semester contribution rather than annual fees.",
    counselorNote: "Check the backlog on her transcript; some departments ask about it.",
    history: [{ status: "proposed_internally", at: "2026-10-12", by: "cns-1" }, { status: "shared", at: "2026-10-15", by: "cns-1" }] },
  { id: "sl-2", studentId: "stu-001", caseId: "case-001", programId: "prg-nl-ds", intakeId: "prg-nl-ds-in1", status: "student_approved",
    reason: "Matches data science interest; selective, so motivation letter matters.",
    studentNote: "Selective programme. The motivation letter carries real weight.", studentFeedback: "Very interested. Happy to apply.",
    history: [{ status: "proposed_internally", at: "2026-10-10", by: "cns-1" }, { status: "shared", at: "2026-10-12", by: "cns-1" },
      { status: "student_approved", at: "2026-10-20", by: "stu-001" }] },
  // Internal only: the student must never see this one until it is shared.
  { id: "sl-3", studentId: "stu-001", caseId: "case-001", programId: "prg-se-ml", intakeId: "prg-se-ml-in1", status: "proposed_internally",
    reason: "Possible; verification of this record is stale, re-check before sharing.", counselorNote: "Do not share until record re-verified.",
    history: [{ status: "proposed_internally", at: "2026-10-30", by: "cns-1" }] },
  { id: "sl-4", studentId: "stu-001", caseId: "case-001", programId: "prg-fr-ai", intakeId: "prg-fr-ai-in1", status: "student_declined",
    reason: "Possible match.", studentNote: "Programme taught partly in French.", studentFeedback: "Prefer English-only programmes.",
    history: [{ status: "shared", at: "2026-10-01", by: "cns-1" }, { status: "student_declined", at: "2026-10-04", by: "stu-001" }] },
  // Shared and waiting for the student's decision.
  { id: "sl-5", studentId: "stu-001", caseId: "case-001", programId: "prg-fi-cs", intakeId: "prg-fi-cs-in1", status: "shared",
    reason: "Possible match; outside stated country preference but worth discussing.",
    studentNote: "Finland was not on your list, but this programme fits your background and is taught in English. Tell us what you think.",
    history: [{ status: "proposed_internally", at: "2026-10-29", by: "cns-1" }, { status: "shared", at: "2026-10-31", by: "cns-1" }] },
];

export const applications: Application[] = [
  { id: "app-1", studentId: "stu-001", caseId: "case-001", programId: "prg-nl-ds", intakeId: "prg-nl-ds-in1", counselorId: "cns-1",
    status: "documents_pending_student", studentStatusLabel: "We need documents from you", route: "direct_portal",
    portalName: "University portal", startedAt: "2026-10-22", fee: { amount: 100, currency: "EUR", paid: false },
    nextAction: "Student to upload motivation letter and two recommendation letters.",
    history: [
      { from: null, to: "planned", at: "2026-10-22", by: "cns-1" },
      { from: "planned", to: "requirements_review", at: "2026-10-23", by: "cns-1" },
      { from: "requirements_review", to: "documents_pending_student", at: "2026-10-26", by: "cns-1", reason: "Letters missing." },
    ] },
  { id: "app-2", studentId: "stu-001", caseId: "case-001", programId: "prg-de-cs", intakeId: "prg-de-cs-in1", counselorId: "cns-1",
    status: "awaiting_student_confirmation", studentStatusLabel: "Please confirm before we submit", route: "uni_assist",
    portalName: "Uni-Assist", startedAt: "2026-10-18", fee: { amount: 75, currency: "EUR", paid: false },
    nextAction: "Student to confirm the application details; then submit via Uni-Assist.",
    history: [
      { from: null, to: "planned", at: "2026-10-18", by: "cns-1" },
      { from: "planned", to: "documents_ready", at: "2026-10-27", by: "cns-1" },
      { from: "documents_ready", to: "awaiting_student_confirmation", at: "2026-10-31", by: "cns-1" },
    ] },
];

export const applicationRequirements: ApplicationRequirement[] = [
  { id: "ar-1", applicationId: "app-1", label: "Motivation letter (about 600 words)", owner: "student", status: "pending", documentId: "doc-007" },
  { id: "ar-2", applicationId: "app-1", label: "Two recommendation letters", owner: "student", status: "pending", documentId: "doc-008" },
  { id: "ar-3", applicationId: "app-1", label: "Bachelor's certificate and transcript", owner: "student", status: "in_review", documentId: "doc-004" },
  { id: "ar-4", applicationId: "app-1", label: "IELTS Academic report", owner: "student", status: "done", documentId: "doc-006" },
  { id: "ar-5", applicationId: "app-1", label: "Complete the university portal form", owner: "counselor", status: "pending" },
  { id: "ar-6", applicationId: "app-1", label: "Pay the application fee (EUR 100)", owner: "student", status: "pending" },
  { id: "ar-7", applicationId: "app-2", label: "Passport copy", owner: "student", status: "done", documentId: "doc-001" },
  { id: "ar-8", applicationId: "app-2", label: "Bachelor's certificate and transcript", owner: "student", status: "in_review", documentId: "doc-004" },
  { id: "ar-9", applicationId: "app-2", label: "Certified copies prepared for Uni-Assist", owner: "counselor", status: "done" },
  { id: "ar-10", applicationId: "app-2", label: "Submit the application through Uni-Assist", owner: "counselor", status: "pending" },
];
