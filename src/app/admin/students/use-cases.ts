"use client";

import { useMemo } from "react";
import { mergeRecords, useAdminWork } from "@/lib/admin-work";
import type { listCasesForAdmin } from "@/lib/data/admin";
import type { CaseStatus } from "@/types";

export type CasesData = Awaited<ReturnType<typeof listCasesForAdmin>>;
export type CaseRow = CasesData["cases"][number];
export const CLOSED: CaseStatus[] = ["completed", "cancelled", "closed"];

/**
 * Cases, counselors and assignment history with this browser's admin changes
 * applied, so workload counts and queues reflect assignments made a moment ago.
 */
export function useCases(adminId: string, data: CasesData) {
  const w = useAdminWork(adminId);
  const cases: CaseRow[] = useMemo(() => {
    const base = data.cases;
    const merged = mergeRecords(base, w.work.cases as Record<string, CaseRow>, (c) => c.id);
    return merged.map((c) => {
      const b = base.find((x) => x.id === c.id);
      const invited = w.work.invited.find((u) => u.id === c.studentId);
      return {
        ...c,
        studentName: b?.studentName ?? invited?.name ?? "New student",
        email: b?.email ?? invited?.email ?? "",
        packageName: b?.packageName ?? data.cases.find((x) => x.packageId === c.packageId)?.packageName ?? c.packageId,
        maxApplications: b?.maxApplications ?? null,
        applications: b?.applications ?? 0,
      };
    });
  }, [data.cases, w.work.cases, w.work.invited]);

  const counselors = useMemo(() => data.counselors.map((c) => {
    const p = w.work.users[c.id] ?? {};
    const mine = cases.filter((x) => x.counselorId === c.id && !CLOSED.includes(x.status));
    return {
      ...c, active: p.active ?? c.active, absent: p.absent ?? c.absent, threshold: p.threshold ?? c.threshold,
      activeCases: mine.length, caseIds: mine.map((x) => x.id),
    };
  }), [data.counselors, w.work.users, cases]);

  const history = (caseId: string) => [...data.assignments, ...w.work.assignments]
    .filter((a) => a.caseId === caseId).sort((a, b) => Date.parse(b.assignedAt) - Date.parse(a.assignedAt));

  return { w, cases, counselors, history };
}
