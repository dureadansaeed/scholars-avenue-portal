"use client";

import { useMemo } from "react";
import { useAdminWork } from "@/lib/admin-work";
import { useCounselorWork } from "@/lib/counselor-work";
import type { getOperationalData } from "@/lib/data/admin";

export type OpsData = Awaited<ReturnType<typeof getOperationalData>>;
export type OpsApplication = OpsData["applications"][number];

/**
 * Operational data with this browser's changes applied: applications counselors
 * created or moved here, and programmes added through the admin catalog.
 */
export function useOperations(adminId: string, data: OpsData) {
  const admin = useAdminWork(adminId);
  const counselor = useCounselorWork("admin-readonly");

  const programs = useMemo(() => {
    const extra = Object.values(admin.work.programs).filter((p) => !data.programs.some((x) => x.id === p.id)).map((p) => ({
      id: p.id, name: `${p.degreeTitle} ${p.name}`, universityId: p.universityId, countryCode: p.countryCode, status: p.status, lastCheckedAt: p.source.lastCheckedAt,
      intakes: p.intakes.map((i) => ({ id: i.id, name: i.name, deadline: i.deadline.kind === "fixed" ? i.deadline.date : null })),
    }));
    return [...data.programs.map((p) => {
      const o = admin.work.programs[p.id];
      return o ? { ...p, status: o.status, lastCheckedAt: o.source.lastCheckedAt } : p;
    }), ...extra];
  }, [data.programs, admin.work.programs]);

  const applications: OpsApplication[] = useMemo(() => {
    const local = counselor.work.applications;
    const studentName = (id: string) => data.studentNames[id] ?? id;
    const merged = data.applications.map((a) => {
      const o = local[a.id];
      return o ? { ...a, status: o.status, submittedAt: o.submittedAt ?? a.submittedAt, decisionAt: o.decisionAt ?? a.decisionAt, history: o.history, nextAction: o.nextAction ?? null, externalRef: o.externalRef ?? null } : a;
    });
    const added = Object.values(local).filter((o) => !data.applications.some((a) => a.id === o.id)).map((o) => ({
      id: o.id, studentId: o.studentId, student: studentName(o.studentId), programId: o.programId, intakeId: o.intakeId, counselorId: o.counselorId,
      status: o.status, route: o.route, startedAt: o.startedAt ?? null, submittedAt: o.submittedAt ?? null, decisionAt: o.decisionAt ?? null,
      externalRef: o.externalRef ?? null, nextAction: o.nextAction ?? null, history: o.history,
    }));
    return [...merged, ...added];
  }, [data.applications, data.studentNames, counselor.work.applications]);

  const programOf = (id: string) => programs.find((p) => p.id === id);
  const universityOf = (id?: string) => data.universities.find((u) => u.id === id)?.name ?? "";
  const counselorOf = (id: string | null) => data.counselors.find((c) => c.id === id)?.name ?? "Unassigned";
  return { admin, applications, programs, programOf, universityOf, counselorOf, ready: admin.ready && counselor.ready };
}
