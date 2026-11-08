// Domain types, shaped by requirementPRD.md. Two conventions matter throughout:
//  * Unknown is explicit. A requirement that is not known is `{ status: "unknown" }`
//    (or `null` on a scalar), never 0 / false / "none" (PRD 7.6.4, 13).
//  * Grades are stored as obtained + scale, separately (PRD 7.2.2).

export type Role = "student" | "counselor" | "admin";
export type ISODate = string; // 2026-11-02 (date-only) or full ISO instant

// ---------- identity ----------
export interface User {
  id: string;
  orgId: string;
  role: Role;
  name: string;
  email: string;
  active: boolean;
}
export interface Counselor extends User {
  role: "counselor";
  languages: string[];
  countryExpertise: string[]; // ISO codes
  absent: boolean;
  workloadThreshold: number;
}
export interface Admin extends User {
  role: "admin";
  permissions: AdminPermission[];
}
export type AdminPermission =
  | "users.manage" | "assignments.manage" | "catalog.manage" | "settings.manage"
  | "reports.export" | "audit.view";

// ---------- statuses (PRD 8) ----------
export type CaseStatus =
  | "invited" | "registration_pending" | "profile_incomplete" | "documents_pending"
  | "under_counselor_review" | "active" | "waiting_for_student" | "waiting_for_counselor"
  | "on_hold" | "completed" | "cancelled" | "closed";

export type VerificationStatus = "verified" | "unverified" | "correction_requested";

export type DocumentStatus =
  | "not_requested" | "requested" | "uploaded" | "under_review" | "verified"
  | "rejected" | "replacement_required" | "expired" | "not_applicable";

export type RecordStatus = "draft" | "pending_review" | "verified" | "needs_update" | "outdated" | "archived";

export type ShortlistStatus =
  | "proposed_internally" | "shared" | "under_discussion" | "student_approved"
  | "student_declined" | "unsuitable" | "application_created" | "removed";

export type TaskStatus =
  | "open" | "in_progress" | "waiting_for_student" | "waiting_for_counselor" | "completed" | "cancelled";

export type ApplicationStatus =
  | "planned" | "requirements_review" | "documents_pending_student" | "documents_under_review"
  | "documents_ready" | "preparation_in_progress" | "awaiting_student_confirmation"
  | "ready_for_submission" | "submitted" | "submission_confirmation_pending"
  | "under_university_review" | "additional_documents_requested" | "assessment_scheduled"
  | "assessment_completed" | "waitlisted" | "offer_received" | "conditional_offer_received"
  | "offer_accepted" | "offer_declined" | "rejected" | "withdrawn" | "closed";

// ---------- student ----------
export interface FieldReview {
  status: VerificationStatus;
  reviewedBy?: string; // counselor id
  reviewedAt?: ISODate;
  note?: string; // reason for a correction request
  /** Prior values kept when a verified field is edited (STU-014). */
  previousValues?: { value: string; changedAt: ISODate }[];
}

export interface StudentProfile {
  studentId: string;
  fullName: string;
  preferredName?: string;
  dateOfBirth?: ISODate;
  nationality?: string;
  countryOfResidence?: string;
  city?: string;
  email: string;
  phone?: string;
  phoneSecondary?: string;
  address?: string;
  passportNumber?: string; // sensitive: masked in views
  emergencyContact?: { name: string; relation: string; phone: string };
  communicationLanguage?: string;
  /** Review state per field key (e.g. "fullName", "passportNumber"). */
  review: Record<string, FieldReview>;
}

export type QualificationLevel = "higher_secondary" | "bachelor" | "master" | "phd";

export interface AcademicRecord {
  id: string;
  studentId: string;
  level: QualificationLevel;
  title: string;
  major: string;
  institution: string;
  institutionCountry: string;
  institutionCity?: string;
  startDate?: ISODate;
  endDate?: ISODate;
  endIsExpected: boolean;
  studyMode?: "full_time" | "part_time" | "online";
  /** Obtained grade and the scale it is on are stored separately and never inferred. */
  gradeObtained: number | null;
  gradeScale: number | null;
  gradeKind: "cgpa" | "percentage" | "other";
  percentage?: number | null;
  classOrRank?: string;
  creditsTotal?: number;
  creditsCompleted?: number;
  thesisTitle?: string;
  backlogs: number | null;
  gapNote?: string;
  awardStatus: "awarded" | "awaiting_result" | "in_progress";
  transcriptDocId?: string;
  certificateDocId?: string;
  review: FieldReview;
}

export type LanguageTestType =
  | "ielts_academic" | "ielts_general" | "toefl_ibt" | "pte_academic"
  | "cambridge" | "duolingo" | "testdaf" | "goethe" | "other";

export interface LanguageTest {
  id: string;
  studentId: string;
  type: LanguageTestType;
  testDate: ISODate;
  overall: number | null;
  maxScore: number | null;
  components: Partial<Record<"listening" | "reading" | "writing" | "speaking", number | null>>;
  reportRef?: string; // restricted
  expiresOn?: ISODate;
  documentId?: string;
  review: FieldReview;
}

export type OtherTestType = "gre" | "gmat" | "sat" | "act" | "testas" | "german_cefr" | "other";
export interface OtherTest {
  id: string;
  studentId: string;
  type: OtherTestType;
  label?: string;
  testDate: ISODate;
  score: number | null;
  maxScore: number | null;
  cefr?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  expiresOn?: ISODate;
  review: FieldReview;
}

export type StudyMode = "full_time" | "part_time";
export interface StudentPreference {
  studentId: string;
  countries: string[]; // ISO codes
  degreeLevels: DegreeLevel[];
  subjects: string[];
  intake?: string; // e.g. "Winter 2027"
  studyMode?: StudyMode;
  cities: string[];
  tuitionMax?: { amount: number; currency: string };
  scholarshipInterest: boolean;
}

// ---------- case / package / assignment ----------
export interface PackageType {
  id: string;
  name: string;
  maxApplications: number | null; // null = not limited
  maxCountries: number | null;
  includes: string[];
}
export interface StudentCase {
  id: string;
  studentId: string;
  packageId: string;
  countries: string[];
  degreeLevels: DegreeLevel[];
  intake?: string;
  createdAt: ISODate;
  activatedAt: ISODate | null;
  paymentConfirmed: boolean;
  counselorId: string | null;
  /** Other counselors with explicit shared access to this case (PRD 4.2). */
  sharedCounselorIds?: string[];
  status: CaseStatus;
  studentOverview?: string; // student-visible
  internalNote?: string; // never sent to the student portal
}
export interface Assignment {
  id: string;
  caseId: string;
  counselorId: string;
  previousCounselorId: string | null;
  assignedBy: string;
  assignedAt: ISODate;
  reason?: string;
}

// ---------- catalog ----------
export type DegreeLevel = "bachelor" | "master" | "phd" | "other";

/** A requirement that can be required, explicitly not required, or not known. */
export type Req<T> = { status: "required"; value: T } | { status: "not_required" } | { status: "unknown" };

export interface SourceRef {
  url: string | null;
  verification: RecordStatus;
  lastCheckedAt: ISODate | null;
  checkedBy?: string;
}

export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  region: string;
  currency: string;
  active: boolean;
  intakeLabels: string[];
  gradingNote?: string;
  languageNote?: string;
  processNote?: string;
  routes: ApplicationRouteType[];
  /** Country-wide guidance only: university, programme and intake rules may override it (PRD 7.6.1A). */
  documentNote?: string;
  feeNote?: string;
  source?: SourceRef;
  catalogProgress: { programs: number; verified: number };
}
export interface City {
  id: string;
  countryCode: string;
  name: string;
  region?: string;
  timezone: string;
  livingCostNote?: string;
  source: SourceRef;
}
export interface University {
  id: string;
  countryCode: string;
  cityIds: string[];
  name: string;
  abbreviations: string[];
  type: "public" | "private" | null;
  website: string | null;
  admissionsUrl: string | null;
  ranking?: { organisation: string; year: number; position: number };
  status: RecordStatus;
  source: SourceRef;
}

export type ApplicationRouteType =
  | "uni_assist" | "direct_portal" | "centralized_portal" | "email" | "external_service" | "other";

export type DeadlineKind = "fixed" | "rolling" | "not_published";

export interface ProgramIntake {
  id: string;
  name: string; // "Winter 2027"
  year: number;
  opensOn: ISODate | null;
  deadline:
    | { kind: "fixed"; date: ISODate; type: "university" | "uni_assist" | "scholarship" | "document"; dateOnly: boolean; timezone?: string }
    | { kind: "rolling" }
    | { kind: "not_published" };
  route: { type: ApplicationRouteType; portalName?: string; portalUrl?: string } | null;
  applicationFee: { amount: number; currency: string } | null;
  tuition: { amount: number; currency: string; per: "year" | "semester" | "programme" } | null;
}

export interface LanguageRequirement {
  testType: LanguageTestType;
  overall: number | null;
  components: Partial<Record<"listening" | "reading" | "writing" | "speaking", number>>;
}

export interface Program {
  id: string;
  universityId: string;
  countryCode: string;
  cityId: string;
  name: string;
  degreeLevel: DegreeLevel;
  degreeTitle: string; // MSc, BSc ...
  subject: string;
  tags: string[];
  languageOfInstruction: string[];
  studyMode: StudyMode;
  durationMonths: number | null;
  description?: string;
  intakes: ProgramIntake[];
  requirements: {
    previousQualification: Req<QualificationLevel>;
    minGrade: Req<{ value: number; scale: number }>;
    languageTests: Req<LanguageRequirement[]>; // accepted tests, each with its own minimums
    otherTests: Req<OtherTestType[]>;
    workExperienceMonths: Req<number>;
  };
  scholarshipAvailable: boolean | null;
  counselorNote?: string;
  studentNote?: string;
  status: RecordStatus;
  source: SourceRef;
  /** All mock catalog content is sample data, never an official fact. */
  sample: true;
  /** Set when the record came from a spreadsheet import (PRD 7.6.6: keep the import batch). */
  importBatchId?: string;
}

// ---------- shortlist / application ----------
export interface ShortlistEntry {
  id: string;
  studentId: string;
  caseId: string;
  programId: string;
  intakeId: string;
  status: ShortlistStatus;
  reason: string;
  counselorNote?: string; // internal
  studentNote?: string; // student-visible
  studentFeedback?: string;
  history: { status: ShortlistStatus; at: ISODate; by: string; reason?: string }[];
}

export interface Application {
  id: string;
  studentId: string;
  caseId: string;
  programId: string;
  intakeId: string;
  counselorId: string;
  status: ApplicationStatus;
  /** Student-facing label, kept separate from the internal status (PRD 7.9.1). */
  studentStatusLabel: string;
  route: ApplicationRouteType;
  portalName?: string;
  portalUrl?: string;
  externalRef?: string;
  startedAt?: ISODate;
  submittedAt?: ISODate;
  fee?: { amount: number; currency: string; paid: boolean };
  nextAction?: string;
  nextActionDue?: ISODate;
  decisionAt?: ISODate;
  /** Conditions attached to a conditional offer. */
  conditions?: string;
  /** The requirements as they stood when the counselor evaluated this application (PRD 7.6.5). */
  snapshot?: RequirementSnapshot;
  /** Submission evidence, or the reason none is available (PRD 4.2). */
  evidence?: ApplicationEvidence[];
  notes?: { id: string; at: ISODate; by: string; text: string }[];
  history: { from: ApplicationStatus | null; to: ApplicationStatus; at: ISODate; by: string; reason?: string }[];
}

// ---------- documents ----------
export type DocumentCategory =
  | "passport" | "cv" | "secondary_certificate" | "higher_secondary_certificate"
  | "bachelor_certificate" | "master_certificate" | "english_test" | "german_certificate"
  | "motivation_letter" | "recommendation_letter" | "experience_letter" | "internship_certificate"
  | "research_evidence" | "portfolio" | "financial" | "university_form" | "other";

export interface DocumentVersion {
  version: number;
  filename: string;
  mime: string;
  sizeBytes: number;
  uploadedAt: ISODate;
  uploadedBy: string;
}
export interface StudentDocument {
  id: string;
  studentId: string;
  category: DocumentCategory;
  title: string;
  status: DocumentStatus;
  required: boolean;
  requestedBy?: string;
  requestNote?: string;
  dueDate?: ISODate;
  expiresOn?: ISODate;
  reviewedBy?: string;
  reviewedAt?: ISODate;
  reason?: string; // rejection / replacement reason, shown to the student
  versions: DocumentVersion[];
}

// ---------- tasks / messages / notifications / timeline ----------
export type DeadlineCategory =
  | "university_application" | "scholarship" | "document" | "payment" | "test_booking" | "internal_review";

export interface Task {
  id: string;
  studentId: string;
  title: string;
  description?: string;
  ownerId: string;
  kind: "student_action" | "internal";
  status: TaskStatus;
  priority: "low" | "normal" | "high";
  category: DeadlineCategory;
  dueDate: ISODate;
  dueDateOnly: boolean;
  related?: { type: "application" | "document" | "profile" | "shortlist" | "case"; id: string };
  createdBy: string;
  completedAt?: ISODate;
  completionNote?: string;
}

export interface Message {
  id: string;
  caseId: string;
  threadId: string;
  senderId: string;
  body: string;
  sentAt: ISODate;
  /** "internal" never reaches a student selector or notification. */
  visibility: "student" | "internal";
  context?: { type: "application" | "task" | "document"; id: string };
  attachmentDocIds: string[];
  readByStudent: boolean;
}

export type NotificationKind =
  | "document_request" | "message" | "shortlist" | "application_status" | "deadline"
  | "assignment" | "correction_request" | "system";

export interface AppNotification {
  id: string;
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: ISODate;
  read: boolean;
  href: string;
}

export interface TimelineEvent {
  id: string;
  caseId: string;
  at: ISODate;
  kind: string;
  title: string;
  detail?: string;
  visibility: "student" | "internal";
}

export interface AuditEntry {
  id: string;
  at: ISODate;
  actorId: string;
  action: string;
  recordType: string;
  recordId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason?: string;
}

export interface ImportBatch {
  id: string;
  filename: string;
  importedBy: string;
  importedAt: ISODate;
  rows: { row: number; name: string; result: "valid" | "error" | "duplicate" | "conflict"; message?: string }[];
  /** How many valid rows were actually applied (imports never apply errors, duplicates or conflicts). */
  applied: number;
}

// ---------- eligibility (engine output) ----------
export type CriterionState =
  | "meets" | "does_not_meet" | "needs_review"
  | "unknown_student" | "unknown_program" | "not_applicable";

export interface CriterionResult {
  key: string;
  label: string;
  state: CriterionState;
  /** Always explains the state. Hard criteria can produce an overall mismatch. */
  reason: string;
  hard: boolean;
}
export type OverallMatch = "confirmed" | "possible" | "mismatch";
export interface MatchResult {
  programId: string;
  intakeId: string;
  overall: OverallMatch;
  criteria: CriterionResult[];
}

// ---------- application checklist ----------
export interface ApplicationRequirement {
  id: string;
  applicationId: string;
  label: string;
  /** Who has to act: students are told which items are theirs and which are handled internally. */
  owner: "student" | "counselor";
  status: "pending" | "in_review" | "done";
  documentId?: string;
}

export interface RequirementSnapshot {
  capturedAt: ISODate;
  programVerification: RecordStatus;
  lastCheckedAt: ISODate | null;
  sourceUrl: string | null;
  intakeName: string;
  deadline: string;
  rows: { label: string; value: string; unknown?: boolean }[];
}
export interface ApplicationEvidence {
  id: string;
  kind: "confirmation" | "fee_receipt" | "other";
  filename?: string;
  /** Set instead of a file when evidence cannot be obtained; always explains why. */
  unavailableReason?: string;
  at: ISODate;
  by: string;
}
