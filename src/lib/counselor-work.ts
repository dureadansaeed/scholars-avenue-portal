"use client";

import { useCallback } from "react";
import { DEMO_NOW } from "@/lib/clock";
import { defaultChecklist, takeSnapshot } from "@/lib/application-rules";
import { newId, useLocalState } from "@/lib/use-local-state";
import type {
  Application, ApplicationRequirement, ApplicationRouteType, ApplicationStatus, Program, ShortlistEntry, ShortlistStatus, Task,
} from "@/types";

/**
 * A counselor's shortlist and application changes, layered over the mock
 * records and kept in this browser until a backend exists. The effective record
 * is the overlay copy when there is one, otherwise the base copy. (The student
 * pages do not read this yet.)
 */
export interface MatchDecision { decision: "accepted" | "unsuitable"; reason: string; at: string; by: string }
export interface CounselorWork {
  shortlist: Record<string, ShortlistEntry>;
  applications: Record<string, Application>;
  checklists: Record<string, ApplicationRequirement[]>;
  /** Counselor's own call on a programme, kept apart from the system's match result (PRD 13.6). */
  decisions: Record<string, MatchDecision>;
  /** Tasks created or changed by this counselor, by id. */
  tasks: Record<string, Task>;
}
const EMPTY: CounselorWork = { shortlist: {}, applications: {}, checklists: {}, decisions: {}, tasks: {} };

export const decisionKey = (studentId: string, programId: string, intakeId: string) => `${studentId}|${programId}|${intakeId}`;

export function mergeById<T extends { id: string }>(base: T[], overlay: Record<string, T>): T[] {
  const ids = new Set(base.map((b) => b.id));
  return [...base.map((b) => overlay[b.id] ?? b), ...Object.values(overlay).filter((o) => !ids.has(o.id))];
}

/** Transitions a shortlist entry may take. Removal and "unsuitable" need a reason. */
export const SHORTLIST_NEXT: Record<ShortlistStatus, ShortlistStatus[]> = {
  proposed_internally: ["shared", "unsuitable", "removed"],
  shared: ["under_discussion", "student_approved", "student_declined", "removed"],
  under_discussion: ["student_approved", "student_declined", "removed"],
  student_approved: ["removed"],
  student_declined: ["proposed_internally", "removed"],
  unsuitable: ["proposed_internally"],
  application_created: [],
  removed: ["proposed_internally"],
};

export function useCounselorWork(counselorId: string) {
  const [stored, setWork, ready] = useLocalState<CounselorWork>("sa:cns:work", EMPTY);
  // Older saved copies predate newer fields; fill the gaps so nothing reads undefined.
  const work: CounselorWork = { ...EMPTY, ...stored };

  const saveEntry = useCallback((entry: ShortlistEntry) => setWork((w) => ({ ...w, shortlist: { ...w.shortlist, [entry.id]: entry } })), [setWork]);

  return {
    work, ready,

    addToShortlist(a: { studentId: string; caseId: string; program: Program; intakeId: string; reason: string; counselorNote?: string; studentNote?: string; duplicateReason?: string }) {
      const entry: ShortlistEntry = {
        id: newId("sl"), studentId: a.studentId, caseId: a.caseId, programId: a.program.id, intakeId: a.intakeId, status: "proposed_internally",
        reason: a.reason, counselorNote: [a.counselorNote, a.duplicateReason && `Duplicate added deliberately: ${a.duplicateReason}`].filter(Boolean).join("\n") || undefined,
        studentNote: a.studentNote || undefined,
        history: [{ status: "proposed_internally", at: DEMO_NOW, by: counselorId, reason: a.duplicateReason }],
      };
      saveEntry(entry);
      return entry;
    },

    moveEntry(entry: ShortlistEntry, to: ShortlistStatus, reason?: string, feedback?: string) {
      saveEntry({
        ...entry, status: to, studentFeedback: feedback ?? entry.studentFeedback,
        history: [...entry.history, { status: to, at: DEMO_NOW, by: counselorId, reason }],
      });
    },

    editNotes(entry: ShortlistEntry, patch: Pick<ShortlistEntry, "reason" | "counselorNote" | "studentNote">) { saveEntry({ ...entry, ...patch }); },

    setDecision(key: string, d: Omit<MatchDecision, "at" | "by">) {
      setWork((w) => ({ ...w, decisions: { ...w.decisions, [key]: { ...d, at: DEMO_NOW, by: counselorId } } }));
    },
    clearDecision(key: string) {
      setWork((w) => { const next = { ...w.decisions }; delete next[key]; return { ...w, decisions: next }; });
    },

    /** Creates a separate application per programme and intake, with its own checklist and a requirement snapshot (PRD 5.4, 7.6.5). */
    createApplication(a: { entry: ShortlistEntry; program: Program; route: ApplicationRouteType; portalName?: string; portalUrl?: string; note?: string }) {
      const intake = a.program.intakes.find((i) => i.id === a.entry.intakeId)!;
      // The id carries enough to rebuild its context on the server when the page loads (see getApplicationBundle).
      const id = `appn~${a.entry.studentId}~${a.entry.programId}~${a.entry.intakeId}~${crypto.randomUUID().slice(0, 4)}`;
      const app: Application = {
        id, studentId: a.entry.studentId, caseId: a.entry.caseId, programId: a.entry.programId, intakeId: a.entry.intakeId, counselorId,
        status: "planned", studentStatusLabel: "Planned", route: a.route, portalName: a.portalName, portalUrl: a.portalUrl, startedAt: DEMO_NOW.slice(0, 10),
        fee: intake.applicationFee ? { ...intake.applicationFee, paid: false } : undefined,
        nextAction: "Review the requirements with the student.", snapshot: takeSnapshot(a.program, intake, DEMO_NOW), evidence: [],
        notes: a.note ? [{ id: newId("n"), at: DEMO_NOW, by: counselorId, text: a.note }] : [],
        history: [{ from: null, to: "planned", at: DEMO_NOW, by: counselorId }],
      };
      setWork((w) => ({
        ...w,
        applications: { ...w.applications, [id]: app },
        checklists: { ...w.checklists, [id]: defaultChecklist(id, a.program, intake, a.portalName) },
        shortlist: { ...w.shortlist, [a.entry.id]: { ...a.entry, status: "application_created", history: [...a.entry.history, { status: "application_created", at: DEMO_NOW, by: counselorId }] } },
      }));
      return app;
    },

    saveTask(task: Task) { setWork((w) => ({ ...w, tasks: { ...(w.tasks ?? {}), [task.id]: task } })); },

    saveApplication(app: Application) { setWork((w) => ({ ...w, applications: { ...w.applications, [app.id]: app } })); },
    saveChecklist(appId: string, items: ApplicationRequirement[]) { setWork((w) => ({ ...w, checklists: { ...w.checklists, [appId]: items } })); },
  };
}

export type { ApplicationStatus };
