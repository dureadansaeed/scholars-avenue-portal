import { requirementRows } from "@/lib/program-format";
import type { Application, ApplicationRequirement, ApplicationStatus, Program, ProgramIntake } from "@/types";

/**
 * Status workflow for applications (PRD 7.9.1). The 22 statuses are defaults,
 * not a line: any listed move is allowed, anything else is not. Configurable
 * workflow rules (APP-017) would replace this table.
 */
export const TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  planned: ["requirements_review", "documents_pending_student", "withdrawn", "closed"],
  requirements_review: ["documents_pending_student", "documents_ready", "preparation_in_progress", "withdrawn", "closed"],
  documents_pending_student: ["documents_under_review", "requirements_review", "withdrawn", "closed"],
  documents_under_review: ["documents_pending_student", "documents_ready", "withdrawn", "closed"],
  documents_ready: ["preparation_in_progress", "awaiting_student_confirmation", "ready_for_submission", "withdrawn", "closed"],
  preparation_in_progress: ["awaiting_student_confirmation", "ready_for_submission", "documents_pending_student", "withdrawn", "closed"],
  awaiting_student_confirmation: ["ready_for_submission", "preparation_in_progress", "withdrawn", "closed"],
  ready_for_submission: ["submitted", "awaiting_student_confirmation", "preparation_in_progress", "withdrawn", "closed"],
  submitted: ["submission_confirmation_pending", "under_university_review", "additional_documents_requested", "withdrawn", "closed"],
  submission_confirmation_pending: ["under_university_review", "additional_documents_requested", "withdrawn", "closed"],
  under_university_review: ["additional_documents_requested", "assessment_scheduled", "waitlisted", "offer_received", "conditional_offer_received", "rejected", "withdrawn", "closed"],
  additional_documents_requested: ["under_university_review", "submitted", "withdrawn", "closed"], // "submitted" again = resubmission (APP-012)
  assessment_scheduled: ["assessment_completed", "withdrawn", "closed"],
  assessment_completed: ["under_university_review", "waitlisted", "offer_received", "conditional_offer_received", "rejected", "withdrawn", "closed"],
  waitlisted: ["offer_received", "conditional_offer_received", "rejected", "withdrawn", "closed"],
  offer_received: ["offer_accepted", "offer_declined", "withdrawn", "closed"],
  conditional_offer_received: ["offer_accepted", "offer_declined", "withdrawn", "closed"],
  offer_accepted: ["closed"], offer_declined: ["closed"], rejected: ["closed"], withdrawn: ["closed"], closed: [],
};

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  planned: "Planned", requirements_review: "Requirements being reviewed", documents_pending_student: "Documents pending from student",
  documents_under_review: "Documents under review", documents_ready: "Documents ready", preparation_in_progress: "Application preparation in progress",
  awaiting_student_confirmation: "Awaiting student confirmation", ready_for_submission: "Ready for submission", submitted: "Submitted",
  submission_confirmation_pending: "Submission confirmation pending", under_university_review: "Under university review",
  additional_documents_requested: "Additional documents requested", assessment_scheduled: "Interview or assessment scheduled",
  assessment_completed: "Interview or assessment completed", waitlisted: "Waitlisted", offer_received: "Offer received",
  conditional_offer_received: "Conditional offer received", offer_accepted: "Offer accepted", offer_declined: "Offer declined",
  rejected: "Rejected", withdrawn: "Withdrawn", closed: "Closed",
};

/** Common reporting categories that survive per-route status changes (APP-017). */
export const GROUPS = ["preparing", "awaiting_student", "submitted", "university", "decision", "ended"] as const;
export type StatusGroup = (typeof GROUPS)[number];
export const GROUP_LABEL: Record<StatusGroup, string> = {
  preparing: "Preparing", awaiting_student: "Waiting on student", submitted: "Submitted", university: "With the university", decision: "Decision", ended: "Ended",
};
export function statusGroup(s: ApplicationStatus): StatusGroup {
  if (["documents_pending_student", "awaiting_student_confirmation"].includes(s)) return "awaiting_student";
  if (["submitted", "submission_confirmation_pending"].includes(s)) return "submitted";
  if (["under_university_review", "additional_documents_requested", "assessment_scheduled", "assessment_completed", "waitlisted"].includes(s)) return "university";
  if (["offer_received", "conditional_offer_received", "offer_accepted"].includes(s)) return "decision";
  if (["offer_declined", "rejected", "withdrawn", "closed"].includes(s)) return "ended";
  return "preparing";
}
/** Active applications must carry a next action (PRD 13.8). */
export const isActive = (s: ApplicationStatus) => statusGroup(s) !== "ended";

const REASON_REQUIRED = new Set<ApplicationStatus>(["withdrawn", "closed", "rejected", "offer_declined"]);

export interface TransitionInput {
  from: ApplicationStatus;
  to: ApplicationStatus;
  reason?: string;
  evidenceCount: number;
  /** Why no evidence exists, if it does not. */
  evidenceUnavailableReason?: string;
  studentConfirmed: boolean;
  /** PRD 16.18, behind `flags.requireStudentConfirmation`. */
  requireConfirmation: boolean;
  /** A reason for proceeding without the student's confirmation. */
  confirmationOverrideReason?: string;
}

export function validateTransition(i: TransitionInput): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!TRANSITIONS[i.from].includes(i.to)) errors.push(`${STATUS_LABEL[i.from]} cannot move to ${STATUS_LABEL[i.to]}.`);
  if (REASON_REQUIRED.has(i.to) && !i.reason?.trim()) errors.push("A reason is required for this outcome.");
  if (i.to === "submitted" && i.evidenceCount === 0 && !i.evidenceUnavailableReason?.trim()) {
    errors.push("Record submission evidence, or say why none is available, before marking this as submitted.");
  }
  if (i.requireConfirmation && !i.studentConfirmed && (i.to === "ready_for_submission" || i.to === "submitted") && i.from !== "ready_for_submission" && !i.confirmationOverrideReason?.trim()) {
    errors.push("The student has not confirmed this application. Wait for their confirmation, or record why you are proceeding without it.");
  }
  return { ok: errors.length === 0, errors };
}

/** Checklist generated from the programme's own requirements. Unknown stays a visible item to confirm, never dropped. */
export function defaultChecklist(appId: string, program: Program, intake: ProgramIntake | undefined, portal?: string): ApplicationRequirement[] {
  const r = program.requirements;
  const items: Omit<ApplicationRequirement, "id" | "applicationId" | "status">[] = [
    { label: "Passport copy", owner: "student" },
    { label: "CV", owner: "student" },
    { label: r.previousQualification.status === "not_required" ? "Previous qualification (not required)" : "Degree certificate and transcript", owner: "student" },
  ];
  if (r.languageTests.status !== "not_required") items.push({ label: r.languageTests.status === "unknown" ? "Language test report (confirm what is accepted)" : "Language test report", owner: "student" });
  if (r.otherTests.status === "required") items.push(...r.otherTests.value.map((t) => ({ label: `${t.toUpperCase()} score report`, owner: "student" as const })));
  items.push({ label: "Motivation letter", owner: "student" });
  if (intake?.applicationFee) items.push({ label: `Pay the application fee (${intake.applicationFee.amount} ${intake.applicationFee.currency})`, owner: "student" });
  items.push({ label: `Complete the application on ${portal ?? intake?.route?.portalName ?? "the portal"}`, owner: "counselor" });
  items.push({ label: "Submit and record the confirmation", owner: "counselor" });
  return items.filter((i) => !i.label.endsWith("(not required)")).map((it, n) => ({ ...it, id: `${appId}-r${n + 1}`, applicationId: appId, status: "pending" as const }));
}

/** Snapshot of the requirements used to evaluate or submit, kept even if the programme record changes later. */
export function takeSnapshot(program: Program, intake: ProgramIntake, now: string): NonNullable<Application["snapshot"]> {
  const d = intake.deadline;
  return {
    capturedAt: now, programVerification: program.status, lastCheckedAt: program.source.lastCheckedAt, sourceUrl: program.source.url,
    intakeName: intake.name, rows: requirementRows(program),
    deadline: d.kind === "fixed" ? d.date : d.kind === "rolling" ? "Rolling" : "Not published",
  };
}

/** Informational only (MAT-012): a straight proportion, never an official equivalence. */
export function proportionalEstimate(obtained: number, fromScale: number, toScale: number) {
  const value = Math.round((obtained / fromScale) * toScale * 100) / 100;
  return { value, formula: `${obtained} ÷ ${fromScale} × ${toScale} = ${value}` };
}
