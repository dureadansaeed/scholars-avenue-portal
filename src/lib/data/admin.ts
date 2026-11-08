import "server-only";
import { isActive, statusGroup, GROUPS, GROUP_LABEL } from "@/lib/application-rules";
import { daysUntil, isPast } from "@/lib/clock";
import { overallCompletion, sectionCompletion } from "@/lib/completion";
import { freshnessWarnings } from "@/lib/program-search";
import { assignments, packages } from "@/mocks/cases";
import { cities, programs, universities } from "@/mocks/catalog";
import { countries } from "@/mocks/countries";
import { audit } from "@/mocks/workflow";
import { admins, counselors } from "@/mocks/users";
import { world } from "@/mocks/world";
import type { AdminPermission, CaseStatus, Role } from "@/types";

/**
 * Organisation-wide reads for the admin portal. Admins see everything in their
 * organisation; what they may *change* is decided by their permissions, which
 * travel with these results so the screens can show controls as disabled with a
 * reason (PRD 4.3: a limited administrator does not get every permission).
 */
const tick = <T,>(v: T) => Promise.resolve(v);
const CLOSED: CaseStatus[] = ["completed", "cancelled", "closed"];
const nameOf = (id: string | null | undefined) =>
  !id ? null : [...world.students, ...counselors, ...admins].find((u) => u.id === id)?.name ?? id;

export async function getAdmin(adminId: string) {
  const a = admins.find((x) => x.id === adminId);
  return tick(a ? { id: a.id, name: a.name, email: a.email, permissions: a.permissions } : null);
}

export async function listDemoAdmins() {
  return tick(admins.filter((a) => a.active).map((a) => ({
    id: a.id, name: a.permissions.length < 6 ? `${a.name} (limited)` : a.name,
  })));
}

function activeCasesFor(counselorId: string) {
  return world.cases.filter((c) => c.counselorId === counselorId && !CLOSED.includes(c.status)).length;
}

export function counselorWorkload() {
  return counselors.map((c) => ({
    id: c.id, name: c.name, email: c.email, active: c.active, absent: c.absent, threshold: c.workloadThreshold,
    activeCases: activeCasesFor(c.id), languages: c.languages, expertise: c.countryExpertise,
    caseIds: world.cases.filter((x) => x.counselorId === c.id && !CLOSED.includes(x.status)).map((x) => x.id),
  }));
}

function deadlineOf(programId: string, intakeId: string) {
  const p = programs.find((x) => x.id === programId);
  const i = p?.intakes.find((x) => x.id === intakeId);
  return i?.deadline.kind === "fixed" ? i.deadline.date : null;
}

export async function getAdminOverview() {
  const cases = world.cases;
  const apps = world.applications;
  const activeApps = apps.filter((a) => isActive(a.status));
  const workload = counselorWorkload();

  const byGroup = GROUPS.map((g) => ({ group: g, label: GROUP_LABEL[g], count: apps.filter((a) => statusGroup(a.status) === g).length }));

  const deadlines = activeApps.flatMap((a) => {
    const d = deadlineOf(a.programId, a.intakeId);
    if (!d) return [];
    const p = programs.find((x) => x.id === a.programId)!;
    const notSubmitted = ["preparing", "awaiting_student"].includes(statusGroup(a.status));
    return [{ id: a.id, student: nameOf(a.studentId)!, programme: `${p.degreeTitle} ${p.name}`, date: d, days: daysUntil(d), missed: isPast(d) && notSubmitted }];
  });

  const overdueTasks = world.tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled" && isPast(t.dueDate));
  // "Delayed": still before submission, and either the deadline is gone or nothing has moved in three weeks.
  const delayed = activeApps.filter((a) => {
    const last = a.history.at(-1)?.at ?? a.startedAt ?? "2026-01-01";
    const d = deadlineOf(a.programId, a.intakeId);
    const before = ["preparing", "awaiting_student"].includes(statusGroup(a.status));
    return before && ((d != null && isPast(d)) || daysUntil(last) < -21);
  }).map((a) => ({ id: a.id, student: nameOf(a.studentId)!, status: a.status, counselor: nameOf(a.counselorId) }));

  const staleProgrammes = programs.filter((p) => p.status !== "archived").flatMap((p) => {
    const w = freshnessWarnings(p, p.intakes[0]).filter((x) => !x.startsWith("Deadline"));
    return w.length ? [{ id: p.id, name: `${p.degreeTitle} ${p.name}`, university: universities.find((u) => u.id === p.universityId)?.name ?? "", warning: w[0], status: p.status }] : [];
  });

  const coverage = workload.flatMap((c) => {
    if (!c.active && c.activeCases) return [{ id: c.id, name: c.name, reason: `Inactive but still holds ${c.activeCases} active case${c.activeCases > 1 ? "s" : ""}` }];
    if (c.absent && c.activeCases) return [{ id: c.id, name: c.name, reason: `Away with ${c.activeCases} active case${c.activeCases > 1 ? "s" : ""} needing cover` }];
    if (c.activeCases > c.threshold) return [{ id: c.id, name: c.name, reason: `Over the workload limit (${c.activeCases} of ${c.threshold})` }];
    return [];
  });

  return tick({
    metrics: {
      totalStudents: world.students.length,
      activeCases: cases.filter((c) => !CLOSED.includes(c.status)).length,
      unassigned: cases.filter((c) => !c.counselorId && !CLOSED.includes(c.status)).length,
      activeApplications: activeApps.length,
    },
    byGroup,
    workload: workload.filter((c) => c.active),
    approaching: deadlines.filter((d) => !d.missed && d.days >= 0 && d.days <= 30).sort((a, b) => a.days - b.days),
    missed: deadlines.filter((d) => d.missed),
    overdueTasks: overdueTasks.length,
    overdueSample: overdueTasks.slice(0, 5).map((t) => ({ id: t.id, title: t.title, student: nameOf(t.studentId)!, dueDate: t.dueDate, studentId: t.studentId })),
    delayed,
    unassignedCases: cases.filter((c) => !c.counselorId && !CLOSED.includes(c.status)).map((c) => ({
      caseId: c.id, studentId: c.studentId, student: nameOf(c.studentId)!, status: c.status, createdAt: c.createdAt,
      package: packages.find((p) => p.id === c.packageId)?.name ?? "",
    })),
    staleProgrammes,
    coverage,
  });
}

// ---------------------------------------------------------------- users
export interface UserRow {
  id: string; name: string; email: string; role: Role; active: boolean;
  detail: string; // a one-line description for the table
  caseStatus?: CaseStatus | null; counselorName?: string | null;
  absent?: boolean; permissions?: AdminPermission[];
}

export function userRows(): UserRow[] {
  const studentRows: UserRow[] = world.students.map((s) => {
    const c = world.cases.find((x) => x.studentId === s.id);
    return {
      id: s.id, name: s.name, email: s.email, role: "student", active: s.active,
      caseStatus: c?.status ?? null, counselorName: nameOf(c?.counselorId),
      detail: c ? `${packages.find((p) => p.id === c.packageId)?.name ?? "No"} package` : "No case yet",
    };
  });
  const counselorRows: UserRow[] = counselors.map((c) => ({
    id: c.id, name: c.name, email: c.email, role: "counselor", active: c.active, absent: c.absent,
    detail: `${activeCasesFor(c.id)} active of ${c.workloadThreshold}`,
  }));
  const adminRows: UserRow[] = admins.map((a) => ({
    id: a.id, name: a.name, email: a.email, role: "admin", active: a.active, permissions: a.permissions,
    detail: `${a.permissions.length} of 6 permissions`,
  }));
  return [...adminRows, ...counselorRows, ...studentRows];
}

export async function listUsers() {
  return tick(userRows());
}

export async function getUserDetail(id: string) {
  const row = userRows().find((u) => u.id === id);
  if (!row) return null;
  const c = row.role === "student" ? world.cases.find((x) => x.studentId === id) : null;
  const counselor = counselors.find((x) => x.id === id);
  const admin = admins.find((x) => x.id === id);
  const related = new Set([id, c?.id].filter(Boolean) as string[]);
  const activity = [
    ...audit.filter((e) => e.actorId === id || related.has(e.recordId)).map((e) => ({
      id: e.id, at: e.at, text: `${nameOf(e.actorId)}: ${e.action.replace(/[._]/g, " ")}`, reason: e.reason,
    })),
    ...assignments.filter((a) => (c && a.caseId === c.id) || a.counselorId === id || a.previousCounselorId === id).map((a) => {
      const cs = world.cases.find((x) => x.id === a.caseId);
      return {
        id: a.id, at: a.assignedAt,
        text: `${nameOf(cs?.studentId)} ${a.previousCounselorId ? `reassigned from ${nameOf(a.previousCounselorId)} to` : "assigned to"} ${nameOf(a.counselorId)} by ${nameOf(a.assignedBy)}`,
        reason: a.reason,
      };
    }),
  ].sort((x, y) => Date.parse(y.at) - Date.parse(x.at));

  let completion: number | null = null;
  if (row.role === "student") {
    const profile = world.profiles.find((p) => p.studentId === id);
    if (profile) {
      completion = overallCompletion(sectionCompletion({
        profile, academics: world.academics.filter((a) => a.studentId === id), languageTests: world.languageTests.filter((t) => t.studentId === id),
        preference: world.preferences.find((p) => p.studentId === id) ?? null, documents: world.documents.filter((d) => d.studentId === id),
      }));
    }
  }

  return tick({
    user: row,
    student: c ? {
      caseId: c.id, status: c.status, packageName: packages.find((p) => p.id === c.packageId)?.name ?? "", counselorName: nameOf(c.counselorId),
      createdAt: c.createdAt, activatedAt: c.activatedAt, paymentConfirmed: c.paymentConfirmed, completion,
    } : null,
    counselor: counselor ? {
      languages: counselor.languages, expertise: counselor.countryExpertise, absent: counselor.absent,
      threshold: counselor.workloadThreshold, activeCases: activeCasesFor(counselor.id),
    } : null,
    admin: admin ? { permissions: admin.permissions } : null,
    activity,
  });
}

// ---------------------------------------------------------------- cases and assignment
export async function listCasesForAdmin() {
  return tick({
    cases: world.cases.map((c) => ({
      ...c,
      studentName: nameOf(c.studentId)!,
      email: world.students.find((s) => s.id === c.studentId)?.email ?? "",
      packageName: packages.find((p) => p.id === c.packageId)?.name ?? "",
      maxApplications: packages.find((p) => p.id === c.packageId)?.maxApplications ?? null,
      applications: world.applications.filter((a) => a.studentId === c.studentId).length,
    })),
    counselors: counselorWorkload(),
    assignments,
    names: Object.fromEntries([...world.students, ...counselors, ...admins].map((u) => [u.id, u.name])),
  });
}

// ---------------------------------------------------------------- catalog
export async function getCatalog() {
  const linked = (programId: string) => world.applications.filter((a) => a.programId === programId).length;
  return tick({
    countries: countries.map((c) => ({
      ...c,
      catalogProgress: {
        programs: programs.filter((p) => p.countryCode === c.code && p.status !== "archived").length,
        verified: programs.filter((p) => p.countryCode === c.code && p.status === "verified").length,
      },
    })),
    cities,
    universities,
    programs,
    linkedApplications: Object.fromEntries(programs.map((p) => [p.id, linked(p.id)])),
    names: Object.fromEntries([...counselors, ...admins].map((u) => [u.id, u.name])),
  });
}

export async function getAdminBadges() {
  const o = await getAdminOverview();
  return { unassigned: o.metrics.unassigned, stale: o.staleProgrammes.length, coverage: o.coverage.length };
}

// ---------------------------------------------------------------- C5 to C6
export async function getImportHistory() {
  const { importBatches } = await import("@/mocks/imports");
  return tick({ batches: importBatches, names: Object.fromEntries(admins.map((a) => [a.id, a.name])) });
}

/** Everything the org-wide applications list and the reports need, in compact rows. */
export async function getOperationalData() {
  const studentName = (id: string) => world.students.find((s) => s.id === id)?.name ?? id;
  return tick({
    applications: world.applications.map((a) => ({
      id: a.id, studentId: a.studentId, student: studentName(a.studentId), programId: a.programId, intakeId: a.intakeId, counselorId: a.counselorId,
      status: a.status, route: a.route, startedAt: a.startedAt ?? null, submittedAt: a.submittedAt ?? null, decisionAt: a.decisionAt ?? null,
      externalRef: a.externalRef ?? null, nextAction: a.nextAction ?? null, history: a.history,
    })),
    programs: programs.map((p) => ({
      id: p.id, name: `${p.degreeTitle} ${p.name}`, universityId: p.universityId, countryCode: p.countryCode, status: p.status, lastCheckedAt: p.source.lastCheckedAt,
      intakes: p.intakes.map((i) => ({ id: i.id, name: i.name, deadline: i.deadline.kind === "fixed" ? i.deadline.date : null })),
    })),
    universities: universities.map((u) => ({ id: u.id, name: u.name })),
    countries: countries.map((c) => ({ code: c.code, name: c.name })),
    counselors: counselors.map((c) => ({ id: c.id, name: c.name })),
    studentNames: Object.fromEntries(world.students.map((s) => [s.id, s.name])),
    cases: world.cases.map((c) => ({ id: c.id, studentId: c.studentId, status: c.status, counselorId: c.counselorId, createdAt: c.createdAt, countries: c.countries })),
    completion: Object.fromEntries(world.profiles.map((p) => [p.studentId, overallCompletion(sectionCompletion({
      profile: p, academics: world.academics.filter((a) => a.studentId === p.studentId), languageTests: world.languageTests.filter((t) => t.studentId === p.studentId),
      preference: world.preferences.find((x) => x.studentId === p.studentId) ?? null, documents: world.documents.filter((d) => d.studentId === p.studentId),
    }))])),
    documents: world.documents.map((d) => ({ id: d.id, studentId: d.studentId, status: d.status, dueDate: d.dueDate ?? null })),
    tasks: world.tasks.map((t) => ({ id: t.id, studentId: t.studentId, status: t.status, dueDate: t.dueDate, kind: t.kind, ownerId: t.ownerId })),
  });
}

export async function getAuditTrail() {
  const names = Object.fromEntries([...world.students, ...counselors, ...admins].map((u) => [u.id, u.name]));
  // Assignment records are part of the audit story too (ASN-003), shown in the same shape.
  const fromAssignments = assignments.map((a) => ({
    id: `as-audit-${a.id}`, at: a.assignedAt, actorId: a.assignedBy, action: a.previousCounselorId ? "case.reassigned" : "case.assigned",
    recordType: "case", recordId: a.caseId, before: a.previousCounselorId ? { counselorId: a.previousCounselorId } : undefined,
    after: { counselorId: a.counselorId }, reason: a.reason,
  }));
  return tick({ entries: [...audit, ...fromAssignments.filter((x) => !audit.some((e) => e.recordId === x.recordId && e.action === x.action && e.at.slice(0, 10) === x.at.slice(0, 10)))], names });
}

export async function getSettingsDefaults() {
  const { STUDENT_STATUS_LABEL, ROUTE_LABEL } = await import("@/lib/student-labels");
  const { DOCUMENT_CATEGORY_LABEL } = await import("@/mocks/workflow");
  return tick({
    statusLabels: STUDENT_STATUS_LABEL,
    packages: packages.map((p) => ({ id: p.id, name: p.name, maxApplications: p.maxApplications, maxCountries: p.maxCountries })),
    documentCategories: DOCUMENT_CATEGORY_LABEL,
    degreeLevels: [
      { key: "bachelor", label: "Bachelor's", enabled: true }, { key: "master", label: "Master's", enabled: true },
      { key: "phd", label: "PhD", enabled: true }, { key: "other", label: "Other", enabled: false },
    ],
    languages: ["English", "Urdu", "German", "Arabic", "Hindi"],
    routes: ROUTE_LABEL,
    templates: [
      { key: "document_request", label: "Document requested", subject: "We need a document from you", body: "Hi {student}, please upload {document} by {due_date}. Your counselor, {counselor}." },
      { key: "status_change", label: "Application status changed", subject: "Update on your {programme} application", body: "Hi {student}, your application is now: {status}." },
      { key: "deadline_reminder", label: "Deadline reminder", subject: "{days} days left: {programme}", body: "Hi {student}, {programme} closes on {deadline}. Anything still needed from you is listed in the portal." },
      { key: "assignment", label: "Counselor assigned", subject: "Meet your counselor", body: "Hi {student}, {counselor} will guide your applications. Start by completing your profile." },
    ],
    reminderDays: [30, 14, 7, 3, 1],
    workloadThreshold: 25,
    reviewIntervalDays: 180,
  });
}
