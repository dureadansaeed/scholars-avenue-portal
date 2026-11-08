import "server-only";
import { daysUntil, isPast } from "@/lib/clock";
import { assignments, packages } from "@/mocks/cases";
import { programs, universities } from "@/mocks/catalog";
import { counselors } from "@/mocks/users";
import { world } from "@/mocks/world";
import type { Task } from "@/types";
import { getStudentHeader } from "./counselor";

/**
 * Counselor-scoped tasks, agenda, activity feed and per-student history.
 * Same access rule as the rest: assigned or explicitly shared cases only.
 */
const tick = <T,>(v: T) => Promise.resolve(v);
const cases = (cid: string) => world.cases.filter((c) => c.counselorId === cid || c.sharedCounselorIds?.includes(cid));
const nameOf = (id: string) => world.students.find((s) => s.id === id)?.name ?? "Unknown";

const OPEN = (t: Task) => t.status !== "completed" && t.status !== "cancelled";

export async function getCounselorTasks(counselorId: string) {
  const ids = new Set(cases(counselorId).map((c) => c.studentId));
  const tasks = world.tasks.filter((t) => ids.has(t.studentId) && (t.kind === "student_action" || t.ownerId === counselorId));
  return tick({
    tasks,
    students: [...ids].map((id) => ({ id, name: nameOf(id) })).sort((a, b) => a.name.localeCompare(b.name)),
  });
}

export async function getStudentTasksForCounselor(counselorId: string, studentId: string) {
  const header = await getStudentHeader(counselorId, studentId);
  if (!header) return null;
  return {
    student: { id: studentId, name: header.name },
    tasks: world.tasks.filter((t) => t.studentId === studentId && (t.kind === "student_action" || t.ownerId === counselorId)),
  };
}

export type AgendaItem = {
  id: string; kind: "task" | "chase" | "deadline" | "test" | "document"; title: string; student: string; studentId: string;
  date: string; overdue: boolean; href: string;
};

export async function getAgenda(counselorId: string) {
  const ids = new Set(cases(counselorId).map((c) => c.studentId));
  const items: AgendaItem[] = [];

  for (const t of world.tasks) {
    if (!ids.has(t.studentId) || !OPEN(t)) continue;
    const mine = t.kind === "internal" ? t.ownerId === counselorId : true;
    if (!mine) continue;
    items.push({ id: t.id, kind: t.kind === "internal" ? "task" : "chase", title: t.title, student: nameOf(t.studentId), studentId: t.studentId, date: t.dueDate, overdue: isPast(t.dueDate), href: `/counselor/students/${t.studentId}/tasks` });
  }
  for (const a of world.applications) {
    if (!ids.has(a.studentId) || ["closed", "withdrawn", "rejected", "offer_declined"].includes(a.status)) continue;
    const p = programs.find((x) => x.id === a.programId)!;
    const i = p.intakes.find((x) => x.id === a.intakeId);
    if (i?.deadline.kind !== "fixed") continue;
    items.push({ id: `dl-${a.id}`, kind: "deadline", title: `Deadline: ${p.degreeTitle} ${p.name}, ${universities.find((u) => u.id === p.universityId)!.name}`, student: nameOf(a.studentId), studentId: a.studentId, date: i.deadline.date, overdue: isPast(i.deadline.date), href: `/counselor/applications/${a.id}` });
  }
  for (const t of world.languageTests) {
    if (!ids.has(t.studentId) || !t.expiresOn || daysUntil(t.expiresOn) > 120) continue;
    items.push({ id: `exp-${t.id}`, kind: "test", title: `${t.type.replace(/_/g, " ")} test ${isPast(t.expiresOn) ? "expired" : "expires"}`, student: nameOf(t.studentId), studentId: t.studentId, date: t.expiresOn, overdue: isPast(t.expiresOn), href: `/counselor/students/${t.studentId}/profile` });
  }
  for (const d of world.documents) {
    if (!ids.has(d.studentId) || d.status !== "requested" || !d.dueDate) continue;
    items.push({ id: `doc-${d.id}`, kind: "document", title: `Document due: ${d.title}`, student: nameOf(d.studentId), studentId: d.studentId, date: d.dueDate, overdue: isPast(d.dueDate), href: `/counselor/students/${d.studentId}/documents` });
  }
  return tick(items.sort((a, b) => Date.parse(a.date) - Date.parse(b.date)));
}

export type FeedItem = { id: string; kind: "assignment" | "upload" | "deadline" | "overdue"; title: string; body: string; at: string; href: string };

export async function getCounselorFeed(counselorId: string) {
  const mine = cases(counselorId);
  const ids = new Set(mine.map((c) => c.studentId));
  const feed: FeedItem[] = [];

  for (const a of assignments.filter((x) => x.counselorId === counselorId)) {
    const c = world.cases.find((x) => x.id === a.caseId)!;
    feed.push({ id: `as-${a.id}`, kind: "assignment", title: `${nameOf(c.studentId)} was assigned to you`, body: a.reason ?? "Start by reviewing their profile.", at: a.assignedAt, href: `/counselor/students/${c.studentId}` });
  }
  for (const d of world.documents) {
    if (!ids.has(d.studentId) || d.status !== "uploaded") continue;
    const at = d.versions[0]?.uploadedAt ?? "2026-10-30";
    feed.push({ id: `up-${d.id}`, kind: "upload", title: `${nameOf(d.studentId)} uploaded ${d.title}`, body: "Waiting for your review.", at, href: `/counselor/students/${d.studentId}/documents` });
  }
  for (const a of world.applications) {
    if (a.counselorId !== counselorId) continue;
    const p = programs.find((x) => x.id === a.programId)!;
    const i = p.intakes.find((x) => x.id === a.intakeId);
    if (i?.deadline.kind === "fixed" && !isPast(i.deadline.date) && daysUntil(i.deadline.date) <= 14) {
      feed.push({ id: `dl-${a.id}`, kind: "deadline", title: `${p.name}: deadline in ${daysUntil(i.deadline.date)} days`, body: `${nameOf(a.studentId)}'s application closes ${i.deadline.date}.`, at: "2026-11-02", href: `/counselor/applications/${a.id}` });
    }
  }
  for (const t of world.tasks) {
    if (!ids.has(t.studentId) || !OPEN(t) || !isPast(t.dueDate) || (t.kind === "internal" && t.ownerId !== counselorId)) continue;
    feed.push({ id: `ov-${t.id}`, kind: "overdue", title: `Overdue: ${t.title}`, body: `${nameOf(t.studentId)} · due ${t.dueDate}`, at: t.dueDate, href: `/counselor/students/${t.studentId}/tasks` });
  }
  return tick(feed.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)));
}

/** Case-level history that does not depend on the counselor's unsaved work. */
export async function getStudentHistoryBase(counselorId: string, studentId: string) {
  const header = await getStudentHeader(counselorId, studentId);
  if (!header) return null;
  const c = world.cases.find((x) => x.studentId === studentId)!;
  const events: { id: string; at: string; title: string; detail?: string; visibility: "student" | "staff" }[] = [
    { id: `c-${c.id}`, at: c.createdAt, title: "Case created", detail: packages.find((p) => p.id === c.packageId)?.name, visibility: "student" },
  ];
  if (c.activatedAt) events.push({ id: `ca-${c.id}`, at: c.activatedAt, title: "Case activated", visibility: "student" });
  for (const a of assignments.filter((x) => x.caseId === c.id)) {
    const to = counselors.find((x) => x.id === a.counselorId)?.name ?? "a counselor";
    const from = counselors.find((x) => x.id === a.previousCounselorId)?.name;
    events.push({ id: a.id, at: a.assignedAt, title: from ? `Reassigned from ${from} to ${to}` : `Assigned to ${to}`, detail: a.reason, visibility: "student" });
  }
  for (const d of world.documents.filter((x) => x.studentId === studentId)) {
    const up = d.versions[0];
    if (up) events.push({ id: `u-${d.id}`, at: up.uploadedAt, title: `${d.title} uploaded${d.versions.length > 1 ? ` (version ${up.version})` : ""}`, visibility: "student" });
    if (d.reviewedAt && ["verified", "rejected", "replacement_required"].includes(d.status)) {
      events.push({ id: `r-${d.id}`, at: d.reviewedAt, title: `${d.title}: ${d.status.replace(/_/g, " ")}`, detail: d.reason, visibility: "student" });
    }
  }
  for (const [field, r] of Object.entries(world.profiles.find((p) => p.studentId === studentId)?.review ?? {})) {
    if (r.reviewedAt && r.status !== "unverified") events.push({ id: `p-${field}`, at: r.reviewedAt, title: `Profile: ${field} ${r.status.replace(/_/g, " ")}`, detail: r.note, visibility: "student" });
  }
  if (c.internalNote) events.push({ id: `n-${c.id}`, at: c.createdAt, title: "Internal case note recorded", detail: c.internalNote, visibility: "staff" });
  return { student: { id: studentId, name: header.name }, events };
}
