import type { ApplicationRouteType, ApplicationStatus } from "@/types";

// The student-facing description is simpler than the internal status (PRD 7.9.1),
// and it must mean the same thing on every screen.
export const STUDENT_STATUS_LABEL: Record<ApplicationStatus, string> = {
  planned: "Planned", requirements_review: "We are checking the requirements",
  documents_pending_student: "We need documents from you", documents_under_review: "We are reviewing your documents",
  documents_ready: "Documents ready", preparation_in_progress: "We are preparing your application",
  awaiting_student_confirmation: "Please confirm before we submit", ready_for_submission: "Ready to submit",
  submitted: "Submitted", submission_confirmation_pending: "Submitted, waiting for confirmation",
  under_university_review: "With the university", additional_documents_requested: "The university asked for more documents",
  assessment_scheduled: "Interview or test scheduled", assessment_completed: "Interview or test completed",
  waitlisted: "Waitlisted", offer_received: "Offer received", conditional_offer_received: "Conditional offer received",
  offer_accepted: "Offer accepted", offer_declined: "Offer declined", rejected: "Not successful",
  withdrawn: "Withdrawn", closed: "Closed",
};

/** Coarse stage for a progress indicator: where is this application overall? */
export const STAGES = ["Preparing", "Submitted", "Decision"] as const;
export function stageOf(s: ApplicationStatus): number {
  if (["submitted", "submission_confirmation_pending", "under_university_review", "additional_documents_requested",
    "assessment_scheduled", "assessment_completed", "waitlisted"].includes(s)) return 1;
  if (["offer_received", "conditional_offer_received", "offer_accepted", "offer_declined", "rejected", "withdrawn", "closed"].includes(s)) return 2;
  return 0;
}

export const ROUTE_LABEL: Record<ApplicationRouteType, string> = {
  uni_assist: "Uni-Assist", direct_portal: "University portal", centralized_portal: "Central application portal",
  email: "Email", external_service: "External application service", other: "Other",
};
