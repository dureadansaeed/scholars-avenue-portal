"use client";

import { useCallback } from "react";
import { DEMO_NOW } from "@/lib/clock";
import { newId, useLocalState } from "@/lib/use-local-state";
import type {
  AdminPermission, ApplicationRouteType, ApplicationStatus, Assignment, AuditEntry, CaseStatus, City, Country, DocumentCategory,
  ImportBatch, Program, Role, StudentCase, University,
} from "@/types";

/**
 * An administrator's changes, kept in this browser until a backend exists and
 * layered over the mock records (overlay wins). Every change also writes an
 * audit entry with the actor, the time, before/after values and the reason
 * (PRD 7.17); nothing here can edit or remove an audit entry.
 */
export interface InvitedUser { id: string; name: string; email: string; role: Role; invitedAt: string; invitedBy: string }
export interface UserPatch { active?: boolean; absent?: boolean; threshold?: number; permissions?: AdminPermission[] }

export interface AdminWork {
  users: Record<string, UserPatch>;
  invited: InvitedUser[];
  cases: Record<string, StudentCase>;
  assignments: Assignment[];
  countries: Record<string, Country>;
  cities: Record<string, City>;
  universities: Record<string, University>;
  programs: Record<string, Program>;
  audit: AuditEntry[];
  batches: ImportBatch[];
  settings: Partial<OrgSettings>;
}
const EMPTY: AdminWork = { users: {}, invited: [], cases: {}, assignments: [], countries: {}, cities: {}, universities: {}, programs: {}, audit: [], batches: [], settings: {} };

/** Organisation configuration (PRD 7.13 ADM-009). Defaults come from the server; edits overlay them. */
export interface OrgSettings {
  statusLabels: Record<ApplicationStatus, string>;
  packages: { id: string; name: string; maxApplications: number | null; maxCountries: number | null }[];
  documentCategories: Record<DocumentCategory, string>;
  degreeLevels: { key: string; label: string; enabled: boolean }[];
  languages: string[];
  routes: Record<ApplicationRouteType, string>;
  templates: { key: string; label: string; subject: string; body: string }[];
  reminderDays: number[];
  workloadThreshold: number;
  reviewIntervalDays: number;
}

/** Only the fields that changed, so the audit entry reads as a diff. */
export function diff(before: object | null, after: object): { before?: Record<string, unknown>; after: Record<string, unknown> } {
  if (!before) return { after: { ...after } };
  const b: Record<string, unknown> = {}, a: Record<string, unknown> = {};
  const B = before as Record<string, unknown>, A = after as Record<string, unknown>;
  for (const k of new Set([...Object.keys(B), ...Object.keys(A)])) {
    if (JSON.stringify(B[k]) !== JSON.stringify(A[k])) { b[k] = B[k]; a[k] = A[k]; }
  }
  return { before: b, after: a };
}

export function useAdminWork(adminId: string) {
  const [stored, set, ready] = useLocalState<AdminWork>("sa:adm:work", EMPTY);
  const work: AdminWork = { ...EMPTY, ...stored };

  const log = useCallback((e: Omit<AuditEntry, "id" | "at" | "actorId">): AuditEntry =>
    ({ ...e, id: newId("au"), at: DEMO_NOW, actorId: adminId }), [adminId]);

  return {
    work, ready,

    // ---------------- accounts
    setUserActive(id: string, name: string, active: boolean, reason: string) {
      set((w) => ({
        ...w, users: { ...w.users, [id]: { ...w.users[id], active } },
        audit: [log({ action: active ? "user.reactivated" : "user.deactivated", recordType: "user", recordId: id, before: { active: !active }, after: { active, name }, reason }), ...(w.audit ?? [])],
      }));
    },
    setCounselor(id: string, patch: Pick<UserPatch, "absent" | "threshold">, before: Pick<UserPatch, "absent" | "threshold">, reason?: string) {
      set((w) => ({
        ...w, users: { ...w.users, [id]: { ...w.users[id], ...patch } },
        audit: [log({ action: "counselor.updated", recordType: "user", recordId: id, ...diff(before, patch), reason }), ...(w.audit ?? [])],
      }));
    },
    setPermissions(id: string, before: AdminPermission[], permissions: AdminPermission[], reason?: string) {
      set((w) => ({
        ...w, users: { ...w.users, [id]: { ...w.users[id], permissions } },
        audit: [log({ action: "admin.permissions_changed", recordType: "user", recordId: id, before: { permissions: before }, after: { permissions }, reason }), ...(w.audit ?? [])],
      }));
    },
    invite(u: Omit<InvitedUser, "id" | "invitedAt" | "invitedBy">, extra?: { packageId: string; countries: string[] }) {
      const id = newId(u.role === "student" ? "stu" : u.role === "counselor" ? "cns" : "adm");
      const invited: InvitedUser = { ...u, id, invitedAt: DEMO_NOW, invitedBy: adminId };
      set((w) => {
        const next: AdminWork = { ...w, invited: [...(w.invited ?? []), invited], audit: [log({ action: "user.invited", recordType: "user", recordId: id, after: { name: u.name, email: u.email, role: u.role } }), ...(w.audit ?? [])] };
        if (extra) {
          const c: StudentCase = {
            id: newId("case"), studentId: id, packageId: extra.packageId, countries: extra.countries, degreeLevels: [], createdAt: DEMO_NOW.slice(0, 10),
            activatedAt: null, paymentConfirmed: false, counselorId: null, status: "invited",
          };
          next.cases = { ...w.cases, [c.id]: c };
          next.audit = [log({ action: "case.created", recordType: "case", recordId: c.id, after: { studentId: id, packageId: extra.packageId, status: "invited" } }), ...next.audit];
        }
        return next;
      });
      return id;
    },

    // ---------------- cases and assignment
    assign(c: StudentCase, counselorId: string, reason?: string) {
      const a: Assignment = { id: newId("as"), caseId: c.id, counselorId, previousCounselorId: c.counselorId, assignedBy: adminId, assignedAt: DEMO_NOW, reason };
      set((w) => ({
        ...w, cases: { ...w.cases, [c.id]: { ...c, counselorId } }, assignments: [...(w.assignments ?? []), a],
        audit: [log({ action: c.counselorId ? "case.reassigned" : "case.assigned", recordType: "case", recordId: c.id, before: { counselorId: c.counselorId }, after: { counselorId }, reason }), ...(w.audit ?? [])],
      }));
    },
    setCaseStatus(c: StudentCase, status: CaseStatus, reason: string) {
      set((w) => ({
        ...w, cases: { ...w.cases, [c.id]: { ...c, status } },
        audit: [log({ action: "case.status_changed", recordType: "case", recordId: c.id, before: { status: c.status }, after: { status }, reason }), ...(w.audit ?? [])],
      }));
    },
    activatePackage(c: StudentCase, reference: string) {
      const status: CaseStatus = c.status === "invited" || c.status === "registration_pending" ? "profile_incomplete" : c.status;
      const next = { ...c, paymentConfirmed: true, activatedAt: c.activatedAt ?? DEMO_NOW.slice(0, 10), status };
      set((w) => ({
        ...w, cases: { ...w.cases, [c.id]: next },
        audit: [log({ action: "case.payment_confirmed", recordType: "case", recordId: c.id, ...diff(c, next), reason: reference ? `Payment reference: ${reference}` : "Marked paid manually" }), ...(w.audit ?? [])],
      }));
    },

    // ---------------- catalog
    saveCountry(before: Country | null, after: Country, reason?: string) {
      set((w) => ({ ...w, countries: { ...w.countries, [after.code]: after }, audit: [log({ action: before ? "country.updated" : "country.created", recordType: "country", recordId: after.code, ...diff(before, after), reason }), ...(w.audit ?? [])] }));
    },
    saveCity(before: City | null, after: City, reason?: string) {
      set((w) => ({ ...w, cities: { ...w.cities, [after.id]: after }, audit: [log({ action: before ? "city.updated" : "city.created", recordType: "city", recordId: after.id, ...diff(before, after), reason }), ...(w.audit ?? [])] }));
    },
    saveUniversity(before: University | null, after: University, reason?: string) {
      set((w) => ({ ...w, universities: { ...w.universities, [after.id]: after }, audit: [log({ action: before ? "university.updated" : "university.created", recordType: "university", recordId: after.id, ...diff(before, after), reason }), ...(w.audit ?? [])] }));
    },
    importPrograms(batch: ImportBatch, created: Program[]) {
      set((w) => ({
        ...w,
        batches: [batch, ...(w.batches ?? [])],
        programs: { ...w.programs, ...Object.fromEntries(created.map((p) => [p.id, p])) },
        audit: [log({ action: "import.applied", recordType: "import", recordId: batch.id, after: { filename: batch.filename, rows: batch.rows.length, applied: batch.applied } }), ...(w.audit ?? [])],
      }));
    },
    saveSettings<K extends keyof OrgSettings>(key: K, before: OrgSettings[K], after: OrgSettings[K], reason?: string) {
      set((w) => ({
        ...w, settings: { ...(w.settings ?? {}), [key]: after },
        audit: [log({ action: "settings.updated", recordType: "settings", recordId: key, before: { [key]: before }, after: { [key]: after }, reason }), ...(w.audit ?? [])],
      }));
    },
    logExport(what: string, rows: number) {
      set((w) => ({ ...w, audit: [log({ action: "export.downloaded", recordType: "export", recordId: what, after: { rows } }), ...(w.audit ?? [])] }));
    },
    saveProgram(before: Program | null, after: Program, reason?: string, action?: string) {
      set((w) => ({ ...w, programs: { ...w.programs, [after.id]: after }, audit: [log({ action: action ?? (before ? "program.updated" : "program.created"), recordType: "program", recordId: after.id, ...diff(before, after), reason }), ...(w.audit ?? [])] }));
    },
  };
}

/** Effective record: the admin's copy if there is one, else the base. New overlay-only records are appended. */
export function mergeRecords<T>(base: T[], overlay: Record<string, T>, key: (t: T) => string): T[] {
  const ids = new Set(base.map(key));
  return [...base.map((b) => overlay[key(b)] ?? b), ...Object.values(overlay).filter((o) => !ids.has(key(o)))];
}
