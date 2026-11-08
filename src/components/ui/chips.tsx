import { cx } from "@/lib/cx";
import type {
  ApplicationStatus, CaseStatus, CriterionState, DocumentStatus, OverallMatch, RecordStatus,
  ShortlistStatus, TaskStatus, VerificationStatus,
} from "@/types";

export type Tone = "ok" | "warn" | "bad" | "info" | "accent" | "neutral";

const CHIP: Record<Tone, string> = {
  ok: "bg-ok-tint text-ok-400", warn: "bg-warn-tint text-warn-400", bad: "bg-bad-tint text-bad-400",
  info: "bg-info-tint text-info-400", accent: "bg-accent-tint text-n-100", neutral: "bg-n-850 text-n-400",
};

/** Tinted pill + dot: colour is never the only cue. */
export function Status({ tone = "neutral", live, children, className }: {
  tone?: Tone; live?: boolean; children: React.ReactNode; className?: string;
}) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-micro font-medium forced-colors:border forced-colors:border-[CanvasText]", CHIP[tone], className)}>
      <span className={cx("size-1.5 shrink-0 rounded-full bg-current forced-colors:bg-[CanvasText]", live && "animate-pulse-dot")} />
      {children}
    </span>
  );
}

export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cx("inline-block rounded-full bg-n-850 px-2 py-0.5 text-micro text-n-400", className)}>{children}</span>;
}

const HUE = {
  blue: "bg-hue-blue text-hue-blue-fg", teal: "bg-hue-teal text-hue-teal-fg", purple: "bg-hue-purple text-hue-purple-fg",
  green: "bg-hue-green text-hue-green-fg", violet: "bg-hue-violet text-hue-violet-fg", pink: "bg-hue-pink text-hue-pink-fg",
  orange: "bg-hue-orange text-hue-orange-fg", red: "bg-hue-red text-hue-red-fg", amber: "bg-hue-amber text-hue-amber-fg",
  cyan: "bg-hue-cyan text-hue-cyan-fg",
} as const;
export function HueChip({ hue, children }: { hue: keyof typeof HUE; children: React.ReactNode }) {
  return <span className={cx("inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-micro font-medium", HUE[hue])}>{children}</span>;
}

/** The sample-data marker required wherever catalog content appears (PRD 17). */
export function SampleTag() {
  return <span className="inline-block rounded-full border border-line px-2 py-0.5 text-micro font-medium tracking-wide text-n-500 uppercase">Sample data</span>;
}

// ---------- status vocabularies: one meaning everywhere (PRD 11.5) ----------
const lbl = (s: string) => s.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

const CASE: Record<CaseStatus, [Tone, string]> = {
  invited: ["neutral", "Invited"], registration_pending: ["neutral", "Registration pending"],
  profile_incomplete: ["warn", "Profile incomplete"], documents_pending: ["warn", "Documents pending"],
  under_counselor_review: ["info", "Under counselor review"], active: ["ok", "Active"],
  waiting_for_student: ["warn", "Waiting for you"], waiting_for_counselor: ["info", "With your counselor"],
  on_hold: ["neutral", "On hold"], completed: ["ok", "Completed"], cancelled: ["neutral", "Cancelled"], closed: ["neutral", "Closed"],
};
export function CaseStatusChip({ status }: { status: CaseStatus }) {
  const [tone, label] = CASE[status];
  return <Status tone={tone}>{label}</Status>;
}

const DOC: Record<DocumentStatus, [Tone, string]> = {
  not_requested: ["neutral", "Not requested"], requested: ["warn", "Requested"], uploaded: ["info", "Uploaded"],
  under_review: ["info", "Under review"], verified: ["ok", "Verified"], rejected: ["bad", "Rejected"],
  replacement_required: ["bad", "Replacement required"], expired: ["bad", "Expired"], not_applicable: ["neutral", "Not applicable"],
};
export function DocumentStatusChip({ status }: { status: DocumentStatus }) {
  const [tone, label] = DOC[status];
  return <Status tone={tone}>{label}</Status>;
}

const VERIF: Record<VerificationStatus, [Tone, string]> = {
  verified: ["ok", "Verified"], unverified: ["neutral", "Not yet reviewed"], correction_requested: ["bad", "Correction requested"],
};
export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const [tone, label] = VERIF[status];
  return <Status tone={tone}>{label}</Status>;
}

const REC: Record<RecordStatus, [Tone, string]> = {
  draft: ["neutral", "Draft"], pending_review: ["warn", "Pending review"], verified: ["ok", "Verified"],
  needs_update: ["warn", "Needs update"], outdated: ["bad", "Outdated"], archived: ["neutral", "Archived"],
};
export function RecordStatusChip({ status }: { status: RecordStatus }) {
  const [tone, label] = REC[status];
  return <Status tone={tone}>{label}</Status>;
}

const TASK: Record<TaskStatus, [Tone, string]> = {
  open: ["info", "Open"], in_progress: ["info", "In progress"], waiting_for_student: ["warn", "Waiting for you"],
  waiting_for_counselor: ["neutral", "With your counselor"], completed: ["ok", "Done"], cancelled: ["neutral", "Cancelled"],
};
export function TaskStatusChip({ status, overdue }: { status: TaskStatus; overdue?: boolean }) {
  if (overdue && status !== "completed" && status !== "cancelled") return <Status tone="bad">Overdue</Status>;
  const [tone, label] = TASK[status];
  return <Status tone={tone}>{label}</Status>;
}

const SHORT: Partial<Record<ShortlistStatus, [Tone, string]>> = {
  shared: ["info", "Awaiting your decision"], under_discussion: ["info", "Under discussion"],
  student_approved: ["ok", "You approved"], student_declined: ["neutral", "You declined"], application_created: ["ok", "Application started"],
};
export function ShortlistStatusChip({ status }: { status: ShortlistStatus }) {
  const [tone, label] = SHORT[status] ?? ["neutral", lbl(status)];
  return <Status tone={tone}>{label}</Status>;
}

export function ApplicationStatusChip({ status, label }: { status: ApplicationStatus; label?: string }) {
  const tone: Tone = ["offer_received", "conditional_offer_received", "offer_accepted"].includes(status) ? "ok"
    : ["rejected", "offer_declined"].includes(status) ? "bad"
    : ["documents_pending_student", "additional_documents_requested", "awaiting_student_confirmation"].includes(status) ? "warn"
    : ["withdrawn", "closed", "planned"].includes(status) ? "neutral" : "info";
  return <Status tone={tone}>{label ?? lbl(status)}</Status>;
}

const CRIT: Record<CriterionState, [Tone, string]> = {
  meets: ["ok", "Meets"], does_not_meet: ["bad", "Does not meet"], needs_review: ["warn", "Needs review"],
  unknown_student: ["neutral", "Unknown: student data missing"], unknown_program: ["neutral", "Unknown: programme data missing"],
  not_applicable: ["neutral", "Not applicable"],
};
export function CriterionChip({ state }: { state: CriterionState }) {
  const [tone, label] = CRIT[state];
  return <Status tone={tone}>{label}</Status>;
}

const MATCH: Record<OverallMatch, [Tone, string]> = {
  confirmed: ["ok", "Meets all checked criteria"], possible: ["warn", "Possible match, needs review"], mismatch: ["bad", "Known mismatch"],
};
export function MatchChip({ overall }: { overall: OverallMatch }) {
  const [tone, label] = MATCH[overall];
  return <Status tone={tone}>{label}</Status>;
}
