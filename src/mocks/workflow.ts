import type {
  AppNotification, AuditEntry, DocumentCategory, StudentDocument, Task, TimelineEvent,
} from "@/types";

// SAMPLE DATA. File names and sizes are invented; no real files exist.
const ver = (filename: string, sizeBytes: number, uploadedAt: string, by = "stu-001", version = 1, mime = "application/pdf") =>
  ({ version, filename, mime, sizeBytes, uploadedAt, uploadedBy: by });

export const DOCUMENT_CATEGORY_LABEL: Record<DocumentCategory, string> = {
  passport: "Passport or national ID", cv: "CV / resume", secondary_certificate: "Secondary certificate and transcript",
  higher_secondary_certificate: "Higher secondary certificate and transcript", bachelor_certificate: "Bachelor's certificate and transcript",
  master_certificate: "Master's certificate and transcript", english_test: "English-language test report",
  german_certificate: "German-language certificate", motivation_letter: "Motivation letter / SOP",
  recommendation_letter: "Recommendation letter", experience_letter: "Experience letter",
  internship_certificate: "Internship certificate", research_evidence: "Research / publication evidence",
  portfolio: "Portfolio or project evidence", financial: "Financial documents", university_form: "University-specific form", other: "Other",
};

const d = (id: string, studentId: string, category: DocumentCategory, title: string,
  status: StudentDocument["status"], rest: Partial<StudentDocument> = {}): StudentDocument =>
  ({ id, studentId, category, title, status, required: true, versions: [], ...rest });

export const documents: StudentDocument[] = [
  d("doc-001", "stu-001", "passport", "Passport", "verified", { reviewedBy: "cns-1", reviewedAt: "2026-09-18", expiresOn: "2031-02-10",
    versions: [ver("passport-scan.pdf", 1_240_000, "2026-09-05")] }),
  d("doc-002", "stu-001", "cv", "CV", "verified", { reviewedBy: "cns-1", reviewedAt: "2026-09-19", versions: [ver("ayesha-khan-cv.pdf", 210_000, "2026-09-06")] }),
  d("doc-003", "stu-001", "higher_secondary_certificate", "FSc certificate and transcript", "rejected", {
    reviewedBy: "cns-1", reviewedAt: "2026-10-25", reason: "The scan is cropped and the transcript marks are unreadable. Please upload a full-page scan.",
    versions: [ver("fsc-docs.jpg", 860_000, "2026-10-20", "stu-001", 1, "image/jpeg")] }),
  d("doc-004", "stu-001", "bachelor_certificate", "Bachelor's degree certificate and transcript", "under_review", {
    versions: [ver("bsc-degree.pdf", 1_980_000, "2026-10-27", "stu-001", 2), ver("bsc-degree-old.pdf", 1_100_000, "2026-09-07", "stu-001", 1)] }),
  d("doc-005", "stu-001", "secondary_certificate", "Matriculation certificate", "replacement_required", {
    reviewedBy: "cns-1", reviewedAt: "2026-10-26", reason: "Certificate needs an attested copy for Uni-Assist.", versions: [ver("matric.pdf", 640_000, "2026-09-08")] }),
  d("doc-006", "stu-001", "english_test", "IELTS Academic report", "uploaded", { versions: [ver("ielts-report.pdf", 420_000, "2026-10-29")] }),
  d("doc-007", "stu-001", "motivation_letter", "Motivation letter (Data Science, Amstelburg)", "requested", {
    requestedBy: "cns-1", requestNote: "About 600 words. Cover why this programme and your federated learning project.", dueDate: "2026-11-10" }),
  d("doc-008", "stu-001", "recommendation_letter", "Recommendation letter 1 (academic)", "requested", { requestedBy: "cns-1", dueDate: "2026-11-20" }),
  d("doc-009", "stu-001", "recommendation_letter", "Recommendation letter 2 (employer)", "requested", { requestedBy: "cns-1", dueDate: "2026-11-20" }),
  d("doc-010", "stu-001", "financial", "Proof of funds", "not_requested", { required: false }),
  d("doc-011", "stu-001", "german_certificate", "German-language certificate", "not_applicable", { required: false }),
  // Expired example for another student, so the status exists in the mock world.
  d("doc-020", "stu-002", "english_test", "IELTS Academic report", "expired", { expiresOn: "2026-09-30", reason: "Test report has expired.", versions: [ver("ielts.pdf", 400_000, "2026-09-20", "stu-002")] }),
  d("doc-021", "stu-002", "passport", "Passport", "requested", { requestedBy: "cns-2", dueDate: "2026-11-05" }),
  d("doc-030", "stu-003", "passport", "Passport", "requested", { requestedBy: "cns-1", dueDate: "2026-11-12" }),
  d("doc-031", "stu-003", "cv", "CV", "requested", { requestedBy: "cns-1", dueDate: "2026-11-12" }),
];

export const tasks: Task[] = [
  { id: "tsk-001", studentId: "stu-001", title: "Upload your motivation letter", description: "About 600 words for the Data Science programme at Amstelburg University.",
    ownerId: "stu-001", kind: "student_action", status: "open", priority: "high", category: "document", dueDate: "2026-11-10", dueDateOnly: true,
    related: { type: "document", id: "doc-007" }, createdBy: "cns-1" },
  { id: "tsk-002", studentId: "stu-001", title: "Re-check your passport number", description: "It does not match the uploaded scan.",
    ownerId: "stu-001", kind: "student_action", status: "open", priority: "high", category: "internal_review", dueDate: "2026-11-04", dueDateOnly: true,
    related: { type: "profile", id: "passportNumber" }, createdBy: "cns-1" },
  { id: "tsk-003", studentId: "stu-001", title: "Re-upload your FSc certificate (full page)", ownerId: "stu-001", kind: "student_action",
    status: "open", priority: "normal", category: "document", dueDate: "2026-11-08", dueDateOnly: true, related: { type: "document", id: "doc-003" }, createdBy: "cns-1" },
  { id: "tsk-004", studentId: "stu-001", title: "Pay the application fee (EUR 100)", ownerId: "stu-001", kind: "student_action",
    status: "waiting_for_counselor", priority: "normal", category: "payment", dueDate: "2027-03-20", dueDateOnly: true, related: { type: "application", id: "app-1" }, createdBy: "cns-1" },
  { id: "tsk-005", studentId: "stu-001", title: "Share your academic reference contact", ownerId: "stu-001", kind: "student_action",
    status: "completed", priority: "low", category: "document", dueDate: "2026-10-18", dueDateOnly: true, createdBy: "cns-1", completedAt: "2026-10-17",
    completionNote: "Sent by message." },
  // Internal tasks: must never reach a student selector.
  { id: "tsk-101", studentId: "stu-001", title: "Re-verify Nordhaven ML record before sharing", ownerId: "cns-1", kind: "internal",
    status: "open", priority: "normal", category: "internal_review", dueDate: "2026-11-06", dueDateOnly: true, createdBy: "cns-1" },
  { id: "tsk-020", studentId: "stu-003", title: "Complete your profile", ownerId: "stu-003", kind: "student_action", status: "open",
    priority: "high", category: "internal_review", dueDate: "2026-11-09", dueDateOnly: true, createdBy: "cns-1" },
];

export const notifications: AppNotification[] = [
  { id: "n-1", userId: "stu-001", kind: "document_request", title: "New document request", body: "Motivation letter, due 10 Nov 2026.", createdAt: "2026-10-27T09:05:00Z", read: false, href: "/student/documents" },
  { id: "n-2", userId: "stu-001", kind: "correction_request", title: "Correction needed on your profile", body: "Passport number does not match the scan.", createdAt: "2026-10-28T08:00:00Z", read: false, href: "/student/profile" },
  { id: "n-4", userId: "stu-001", kind: "document_request", title: "Document needs replacing", body: "FSc certificate was rejected.", createdAt: "2026-10-25T14:00:00Z", read: false, href: "/student/documents" },
  { id: "n-5", userId: "stu-003", kind: "assignment", title: "Your counselor is Sana Malik", body: "Start by completing your profile.", createdAt: "2026-10-22T10:00:00Z", read: false, href: "/student/profile" },
];

export const timeline: TimelineEvent[] = [
  { id: "tl-1", caseId: "case-001", at: "2026-08-22", kind: "case", title: "Case activated", visibility: "student" },
  { id: "tl-2", caseId: "case-001", at: "2026-09-02", kind: "assignment", title: "Sana Malik became your counselor", visibility: "student" },
  { id: "tl-3", caseId: "case-001", at: "2026-10-12", kind: "shortlist", title: "Programme shared: Data Science, Amstelburg University", visibility: "student" },
  { id: "tl-4", caseId: "case-001", at: "2026-10-22", kind: "application", title: "Application started: Data Science, Amstelburg University", visibility: "student" },
  { id: "tl-5", caseId: "case-001", at: "2026-10-30", kind: "shortlist", title: "Internal: Nordhaven ML proposed", visibility: "internal" },
];

export const audit: AuditEntry[] = [
  { id: "au-1", at: "2026-09-02T08:30:00Z", actorId: "adm-1", action: "case.reassigned", recordType: "case", recordId: "case-001",
    before: { counselorId: "cns-3" }, after: { counselorId: "cns-1" }, reason: "Counselor on extended leave." },
  { id: "au-2", at: "2026-10-28T08:00:00Z", actorId: "cns-1", action: "profile.field.correction_requested", recordType: "student_profile", recordId: "stu-001",
    before: { passportNumber: "unverified" }, after: { passportNumber: "correction_requested" } },
];
