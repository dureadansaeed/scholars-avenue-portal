import "server-only";
import { daysUntil, isPast } from "@/lib/clock";
import { overallCompletion, sectionCompletion } from "@/lib/completion";
import { packages } from "@/mocks/cases";
import { programs, universities } from "@/mocks/catalog";
import { admins, counselors } from "@/mocks/users";
import { world } from "@/mocks/world";
import type { StudentCase } from "@/types";

/**
 * Counselor-scoped reads. A counselor reaches a student only through a case
 * they are assigned to or that is explicitly shared with them (PRD 4.2, ASN-004).
 * Anything else returns null, which the page renders as not-found: another
 * counselor's student and a made-up id look the same.
 */
const tick = <T,>(v: T) => Promise.resolve(v);
const TEST_WARN_DAYS = 90;

export type Access = "own" | "shared";

function accessFor(counselorId: string, c: StudentCase): Access | null {
  if (c.counselorId === counselorId) return "own";
  if (c.sharedCounselorIds?.includes(counselorId)) return "shared";
  return null;
}
const myCases = (counselorId: string) =>
  world.cases.flatMap((c) => { const a = accessFor(counselorId, c); return a ? [{ c, access: a }] : []; });

const reviewerNames = () => Object.fromEntries([...counselors, ...admins, ...world.students].map((u) => [u.id, u.name]));
const nameOf = (studentId: string) => world.students.find((s) => s.id === studentId)?.name ?? "Unknown";

/** Everything a counselor needs to see at a glance about one student's record. */
function facts(studentId: string) {
  const profile = world.profiles.find((p) => p.studentId === studentId)!;
  const academics = world.academics.filter((a) => a.studentId === studentId);
  const languageTests = world.languageTests.filter((t) => t.studentId === studentId);
  const otherTests = world.otherTests.filter((t) => t.studentId === studentId);
  const preference = world.preferences.find((p) => p.studentId === studentId) ?? null;
  const documents = world.documents.filter((d) => d.studentId === studentId);
  return { profile, academics, languageTests, otherTests, preference, documents };
}

export function studentGaps(studentId: string) {
  const f = facts(studentId);
  const sections = sectionCompletion({ profile: f.profile, academics: f.academics, languageTests: f.languageTests, preference: f.preference, documents: f.documents });
  const missing = sections.flatMap((s) => s.missing.map((item) => ({ section: s.label, item, href: s.href })));

  const reviewable = (["fullName", "dateOfBirth", "passportNumber", "nationality"] as const)
    .filter((k) => f.profile[k]).filter((k) => f.profile.review[k]?.status !== "verified" && f.profile.review[k]?.status !== "correction_requested").length;
  const unverified = reviewable
    + f.academics.filter((a) => a.review.status === "unverified").length
    + f.languageTests.filter((t) => t.review.status === "unverified").length
    + f.otherTests.filter((t) => t.review.status === "unverified").length;

  const expiredTests = f.languageTests.filter((t) => t.expiresOn && isPast(t.expiresOn)).map((t) => ({ id: t.id, label: t.type.replace(/_/g, " "), expiresOn: t.expiresOn! }));
  const expiringTests = f.languageTests.filter((t) => t.expiresOn && !isPast(t.expiresOn) && daysUntil(t.expiresOn) <= TEST_WARN_DAYS)
    .map((t) => ({ id: t.id, label: t.type.replace(/_/g, " "), expiresOn: t.expiresOn!, days: daysUntil(t.expiresOn!) }));
  const expiredDocs = f.documents.filter((d) => d.status === "expired").map((d) => ({ id: d.id, label: d.title }));
  const corrections = Object.entries(f.profile.review).filter(([, r]) => r.status === "correction_requested").map(([field]) => field);
  const awaitingReview = f.documents.filter((d) => d.status === "uploaded" || d.status === "under_review").length;

  return { completion: overallCompletion(sections), sections, missing, unverified, expiredTests, expiringTests, expiredDocs, corrections, awaitingReview };
}

function row(studentId: string, c: StudentCase, access: Access) {
  const g = studentGaps(studentId);
  const tasks = world.tasks.filter((t) => t.studentId === studentId && t.status !== "completed" && t.status !== "cancelled");
  return {
    id: studentId, name: nameOf(studentId), email: world.students.find((s) => s.id === studentId)?.email ?? "",
    caseId: c.id, caseStatus: c.status, packageName: packages.find((p) => p.id === c.packageId)?.name ?? "", countries: c.countries,
    completion: g.completion, missingCount: g.missing.length, unverifiedCount: g.unverified, awaitingReview: g.awaitingReview,
    corrections: g.corrections.length,
    testAlert: g.expiredTests.length ? ("expired" as const) : g.expiringTests.length ? ("expiring" as const) : null,
    overdueTasks: tasks.filter((t) => isPast(t.dueDate)).length, access,
    ownerName: access === "shared" ? counselors.find((x) => x.id === c.counselorId)?.name ?? null : null,
  };
}

export type StudentRow = ReturnType<typeof row>;

export async function getCounselor(counselorId: string) {
  const c = counselors.find((x) => x.id === counselorId);
  return tick(c ? { id: c.id, name: c.name, email: c.email, absent: c.absent, threshold: c.workloadThreshold } : null);
}

export async function listDemoCounselors() {
  return tick(counselors.filter((c) => c.active).map((c) => ({ id: c.id, name: c.absent ? `${c.name} (away)` : c.name })));
}

export async function listCounselorStudents(counselorId: string) {
  return tick(myCases(counselorId).map(({ c, access }) => row(c.studentId, c, access))
    .sort((a, b) => a.name.localeCompare(b.name)));
}

export async function getCounselorDashboard(counselorId: string) {
  const mine = myCases(counselorId);
  const rows = mine.map(({ c, access }) => row(c.studentId, c, access));
  const ids = new Set(rows.map((r) => r.id));
  const counselor = counselors.find((c) => c.id === counselorId)!;

  const ownActive = rows.filter((r) => r.access === "own" && !["completed", "cancelled", "closed"].includes(r.caseStatus)).length;
  const myApps = world.applications.filter((a) => a.counselorId === counselorId && !["closed", "withdrawn", "rejected", "offer_declined"].includes(a.status));

  const openTasks = world.tasks.filter((t) => ids.has(t.studentId) && t.status !== "completed" && t.status !== "cancelled"
    && ((t.kind === "internal" && t.ownerId === counselorId) || (t.kind === "student_action" && t.createdBy === counselorId)));
  const overdue = openTasks.filter((t) => isPast(t.dueDate));

  const today = [
    ...openTasks.filter((t) => isPast(t.dueDate) || daysUntil(t.dueDate) <= 7).map((t) => ({
      id: t.id, kind: (t.kind === "internal" ? "task" : "chase") as "task" | "chase", title: t.title, studentId: t.studentId, student: nameOf(t.studentId),
      date: t.dueDate, overdue: isPast(t.dueDate),
    })),
    ...myApps.flatMap((a) => {
      const p = programs.find((x) => x.id === a.programId)!;
      const i = p.intakes.find((x) => x.id === a.intakeId);
      if (!i || i.deadline.kind !== "fixed") return [];
      const d = daysUntil(i.deadline.date);
      return d <= 30 ? [{ id: a.id, kind: "deadline" as const, title: `${p.degreeTitle} ${p.name}, ${universities.find((u) => u.id === p.universityId)!.name}`,
        studentId: a.studentId, student: nameOf(a.studentId), date: i.deadline.date, overdue: d < 0 }] : [];
    }),
    ...world.documents.filter((d) => ids.has(d.studentId) && d.status === "uploaded").map((d) => ({
      id: d.id, kind: "upload" as const, title: `${d.title} uploaded`, studentId: d.studentId, student: nameOf(d.studentId),
      date: d.versions[0]?.uploadedAt ?? "2026-10-30", overdue: false,
    })),
  ].sort((a, b) => Number(b.overdue) - Number(a.overdue) || Date.parse(a.date) - Date.parse(b.date));

  return tick({
    counselor: { id: counselor.id, name: counselor.name, absent: counselor.absent, threshold: counselor.workloadThreshold },
    metrics: {
      assigned: rows.filter((r) => r.access === "own").length, shared: rows.filter((r) => r.access === "shared").length, ownActive,
      activeApplications: myApps.length,
      pendingReviews: rows.reduce((n, r) => n + r.awaitingReview, 0),
      unverifiedItems: rows.reduce((n, r) => n + r.unverifiedCount, 0),
      overdueTasks: overdue.length,
    },
    attention: rows.filter((r) => r.corrections || r.testAlert || r.awaitingReview).slice(0, 6),
    today: today.slice(0, 12),
  });
}

/** Counts for the sidebar. */
export async function getCounselorBadgeCounts(counselorId: string) {
  const d = await getCounselorDashboard(counselorId);
  return { pendingReviews: d.metrics.pendingReviews, overdueTasks: d.metrics.overdueTasks };
}

export async function getStudentWorkspace(counselorId: string, studentId: string) {
  const entry = myCases(counselorId).find(({ c }) => c.studentId === studentId);
  if (!entry) return null;
  const { c, access } = entry;
  const f = facts(studentId);
  const owner = counselors.find((x) => x.id === c.counselorId);
  return tick({
    ...f,
    row: row(studentId, c, access),
    gaps: studentGaps(studentId),
    case: { id: c.id, status: c.status, intake: c.intake ?? null, createdAt: c.createdAt, activatedAt: c.activatedAt, paymentConfirmed: c.paymentConfirmed, internalNote: c.internalNote ?? null, overview: c.studentOverview ?? null },
    owner: owner ? { id: owner.id, name: owner.name } : null,
    openTasks: world.tasks.filter((t) => t.studentId === studentId && t.status !== "completed" && t.status !== "cancelled").length,
    applications: world.applications.filter((a) => a.studentId === studentId).length,
    reviewerNames: reviewerNames(),
  });
}

export async function getStudentHeader(counselorId: string, studentId: string) {
  const entry = myCases(counselorId).find(({ c }) => c.studentId === studentId);
  if (!entry) return null;
  return tick(row(studentId, entry.c, entry.access));
}
