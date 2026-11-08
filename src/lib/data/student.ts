import "server-only";
import { isPast } from "@/lib/clock";
import { sectionCompletion, overallCompletion } from "@/lib/completion";
import { admins, counselors, students } from "@/mocks/users";
import { academics, languageTests, otherTests, preferences, profiles } from "@/mocks/students";
import { applications, cases, packages, shortlist } from "@/mocks/cases";
import { documents, notifications, tasks, timeline } from "@/mocks/workflow";
import { programs, universities, cities } from "@/mocks/catalog";
import type { Task } from "@/types";

/**
 * Student-scoped reads. Every function takes the student id and returns only
 * what that student may see: no internal notes, no unshared shortlist entries,
 * no internal tasks or timeline events (PRD 4.1, 10). The same boundaries move
 * to the server when a real backend replaces these mocks.
 */

const tick = <T,>(v: T) => Promise.resolve(v);

export async function listDemoStudents() {
  return tick(students.map((s) => ({ id: s.id, name: s.name })));
}

export async function getStudentHome(studentId: string) {
  const user = students.find((s) => s.id === studentId);
  const profile = profiles.find((p) => p.studentId === studentId);
  if (!user || !profile) return null;

  const studentCase = cases.find((c) => c.studentId === studentId) ?? null;
  const counselor = counselors.find((c) => c.id === studentCase?.counselorId) ?? null;
  const pkg = packages.find((p) => p.id === studentCase?.packageId) ?? null;

  const docs = documents.filter((d) => d.studentId === studentId);
  const academicRecords = academics.filter((a) => a.studentId === studentId);
  const tests = languageTests.filter((t) => t.studentId === studentId);
  const preference = preferences.find((p) => p.studentId === studentId) ?? null;

  const sections = sectionCompletion({ profile, academics: academicRecords, languageTests: tests, preference, documents: docs });

  // Only student-action tasks. Internal tasks never leave this function.
  const studentTasks: Task[] = tasks.filter((t) => t.studentId === studentId && t.kind === "student_action");
  const openTasks = studentTasks
    .filter((t) => t.status !== "completed" && t.status !== "cancelled")
    .sort((a, b) => Date.parse(a.dueDate) - Date.parse(b.dueDate))
    .map((t) => ({ ...t, overdue: isPast(t.dueDate) }));

  const corrections = Object.entries(profile.review)
    .filter(([, r]) => r.status === "correction_requested")
    .map(([field, r]) => ({ field, note: r.note ?? "" }));

  const myApps = applications.filter((a) => a.studentId === studentId).map((a) => {
    const program = programs.find((p) => p.id === a.programId)!;
    const intake = program.intakes.find((i) => i.id === a.intakeId)!;
    return {
      id: a.id, status: a.status, studentStatusLabel: a.studentStatusLabel, programName: `${program.degreeTitle} ${program.name}`,
      universityName: universities.find((u) => u.id === program.universityId)!.name,
      cityName: cities.find((c) => c.id === program.cityId)!.name, intakeName: intake.name,
      deadline: intake.deadline.kind === "fixed" ? intake.deadline.date : null,
    };
  });

  const shared = shortlist.filter((s) => s.studentId === studentId && ["shared", "under_discussion", "student_approved", "student_declined", "application_created"].includes(s.status));
  const unread = notifications.filter((n) => n.userId === studentId && !n.read).length;

  return tick({
    user, profile, studentCase: studentCase
      ? { id: studentCase.id, status: studentCase.status, intake: studentCase.intake ?? null, overview: studentCase.studentOverview ?? null, countries: studentCase.countries }
      : null,
    counselor: counselor ? { id: counselor.id, name: counselor.name, email: counselor.email, languages: counselor.languages } : null,
    packageName: pkg?.name ?? null,
    sections, completion: overallCompletion(sections),
    openTasks, corrections, applications: myApps, sharedProgrammeCount: shared.length,
    awaitingDecision: shared.filter((s) => s.status === "shared").length,
    unreadNotifications: unread,
    documentsNeedingAction: docs.filter((d) => ["requested", "rejected", "replacement_required", "expired"].includes(d.status)).length,
    recentTimeline: timeline.filter((t) => t.caseId === studentCase?.id && t.visibility === "student")
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 4),
  });
}

export async function getStudentProfileBundle(studentId: string) {
  const profile = profiles.find((p) => p.studentId === studentId);
  if (!profile) return null;
  const studentCase = cases.find((c) => c.studentId === studentId);
  return tick({
    profile,
    academics: academics.filter((a) => a.studentId === studentId),
    languageTests: languageTests.filter((t) => t.studentId === studentId),
    otherTests: otherTests.filter((t) => t.studentId === studentId),
    preference: preferences.find((p) => p.studentId === studentId) ?? {
      studentId, countries: [], degreeLevels: [], subjects: [], cities: [], scholarshipInterest: false,
    },
    documents: documents.filter((d) => d.studentId === studentId),
    reviewerNames: Object.fromEntries([...counselors, ...admins].map((u) => [u.id, u.name])),
    counselorName: counselors.find((c) => c.id === studentCase?.counselorId)?.name ?? null,
  });
}

export async function getStudentDocuments(studentId: string) {
  const reviewerNames = Object.fromEntries([...counselors, ...admins].map((u) => [u.id, u.name]));
  return tick({ documents: documents.filter((d) => d.studentId === studentId), reviewerNames });
}
