import "server-only";
import { isPast } from "@/lib/clock";
import { ROUTE_LABEL, STUDENT_STATUS_LABEL } from "@/lib/student-labels";
import { applicationRequirements, applications, cases, shortlist } from "@/mocks/cases";
import { cities, programs, universities } from "@/mocks/catalog";
import { countryName } from "@/mocks/countries";
import { documents, notifications, tasks, timeline } from "@/mocks/workflow";
import { counselors } from "@/mocks/users";
import type { ProgramIntake, ShortlistStatus } from "@/types";

/**
 * Student-scoped reads for programmes, applications, tasks,
 * notifications and the timeline. Same rule as student.ts: only what this
 * student may see leaves these functions (PRD 4.1, 10). Counselor-only fields
 * (selection reason, counselor notes, internal next actions, history reasons)
 * are never copied into the returned objects.
 */
const tick = <T,>(v: T) => Promise.resolve(v);

const VISIBLE: ShortlistStatus[] = ["shared", "under_discussion", "student_approved", "student_declined", "application_created"];

function programView(programId: string, intakeId: string) {
  const program = programs.find((p) => p.id === programId)!;
  const uni = universities.find((u) => u.id === program.universityId)!;
  const city = cities.find((c) => c.id === program.cityId)!;
  const intake = program.intakes.find((i) => i.id === intakeId) as ProgramIntake;
  return {
    id: program.id, name: program.name, degreeTitle: program.degreeTitle, subject: program.subject, tags: program.tags,
    durationMonths: program.durationMonths, languages: program.languageOfInstruction, studyMode: program.studyMode,
    scholarshipAvailable: program.scholarshipAvailable, studentNote: program.studentNote ?? null,
    requirements: program.requirements, verification: program.status, lastCheckedAt: program.source.lastCheckedAt,
    sourceUrl: program.source.url,
    university: { name: uni.name, type: uni.type }, city: city.name, country: countryName(program.countryCode),
    intake,
  };
}

export async function getStudentProgrammes(studentId: string) {
  const items = shortlist.filter((s) => s.studentId === studentId && VISIBLE.includes(s.status)).map((s) => ({
    id: s.id, status: s.status, studentNote: s.studentNote ?? null, studentFeedback: s.studentFeedback ?? null,
    application: applications.find((a) => a.programId === s.programId && a.intakeId === s.intakeId && a.studentId === studentId)?.id ?? null,
    programme: programView(s.programId, s.intakeId),
  }));
  return tick(items);
}

export async function getStudentApplications(studentId: string) {
  return tick(applications.filter((a) => a.studentId === studentId).map((a) => {
    const reqs = applicationRequirements.filter((r) => r.applicationId === a.id);
    return {
      id: a.id, status: a.status, label: a.studentStatusLabel, route: ROUTE_LABEL[a.route],
      programme: programView(a.programId, a.intakeId),
      studentTodo: reqs.filter((r) => r.owner === "student" && r.status === "pending").length,
      totalItems: reqs.length, doneItems: reqs.filter((r) => r.status === "done").length,
    };
  }));
}

export async function getStudentApplication(studentId: string, applicationId: string) {
  const a = applications.find((x) => x.id === applicationId);
  // Another student's id and an unknown id are indistinguishable (PRD 10.20).
  if (!a || a.studentId !== studentId) return null;
  const counselor = counselors.find((c) => c.id === a.counselorId);
  return tick({
    id: a.id, status: a.status, label: a.studentStatusLabel, route: ROUTE_LABEL[a.route], portalName: a.portalName ?? null,
    portalUrl: a.portalUrl ?? null, externalRef: a.externalRef ?? null, startedAt: a.startedAt ?? null, submittedAt: a.submittedAt ?? null,
    fee: a.fee ?? null, counselorName: counselor?.name ?? null,
    programme: programView(a.programId, a.intakeId),
    checklist: applicationRequirements.filter((r) => r.applicationId === a.id).map((r) => ({
      ...r, document: r.documentId ? documents.find((d) => d.id === r.documentId)?.status ?? null : null,
    })),
    events: a.history.map((h) => ({ id: `${a.id}-${h.to}-${h.at}`, at: h.at, title: STUDENT_STATUS_LABEL[h.to] })).reverse(),
  });
}

export async function getStudentTasks(studentId: string) {
  return tick(tasks.filter((t) => t.studentId === studentId && t.kind === "student_action")
    .map((t) => ({ ...t, overdue: t.status !== "completed" && isPast(t.dueDate) }))
    .sort((a, b) => Date.parse(a.dueDate) - Date.parse(b.dueDate)));
}

export async function getStudentNotifications(studentId: string) {
  return tick(notifications.filter((n) => n.userId === studentId).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
}

export async function getStudentTimeline(studentId: string) {
  const c = cases.find((x) => x.studentId === studentId);
  const caseEvents = timeline.filter((t) => t.caseId === c?.id && t.visibility === "student")
    .map((t) => ({ id: t.id, at: t.at, title: t.title, detail: t.detail }));
  const appEvents = applications.filter((a) => a.studentId === studentId).flatMap((a) => {
    const p = programView(a.programId, a.intakeId);
    return a.history.map((h) => ({
      id: `${a.id}-${h.to}-${h.at}`, at: h.at, title: `${p.degreeTitle} ${p.name}, ${p.university.name}`, detail: STUDENT_STATUS_LABEL[h.to],
    }));
  });
  const docEvents = documents.filter((d) => d.studentId === studentId && d.reviewedAt && ["verified", "rejected", "replacement_required"].includes(d.status))
    .map((d) => ({ id: `doc-${d.id}`, at: d.reviewedAt!, title: `${d.title}: ${d.status === "verified" ? "verified" : "needs replacing"}`, detail: undefined as string | undefined }));
  return tick([...caseEvents, ...appEvents, ...docEvents].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)));
}

/** What the server knows is unread / open, for the sidebar badges. */
export async function getStudentBadgeInputs(studentId: string) {
  return tick({
    unreadNotificationIds: notifications.filter((n) => n.userId === studentId && !n.read).map((n) => n.id),
    openTaskIds: tasks.filter((t) => t.studentId === studentId && t.kind === "student_action" && t.status !== "completed" && t.status !== "cancelled").map((t) => t.id),
    docActionIds: documents.filter((d) => d.studentId === studentId && ["requested", "rejected", "replacement_required", "expired"].includes(d.status)).map((d) => d.id),
  });
}
