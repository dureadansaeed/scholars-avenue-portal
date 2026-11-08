"use client";

import Link from "next/link";
import { buttonClass } from "@/components/ui/button-styles";
import { CaseStatusChip } from "@/components/ui/chips";
import { Empty } from "@/components/ui/panels";
import { useAdminWork } from "@/lib/admin-work";
import { formatDate } from "@/lib/clock";
import type { CaseStatus } from "@/types";

interface Row { caseId: string; studentId: string; student: string; status: CaseStatus; createdAt: string; package: string }

/** Unassigned cases, minus any assigned in this browser since the page was rendered. */
export function UnassignedQueue({ adminId, rows }: { adminId: string; rows: Row[] }) {
  const { work } = useAdminWork(adminId);
  const extra = Object.values(work.cases).filter((c) => !c.counselorId && !rows.some((r) => r.caseId === c.id));
  const open = [
    ...rows.filter((r) => !work.cases[r.caseId]?.counselorId),
    ...extra.map((c) => ({ caseId: c.id, studentId: c.studentId, student: work.invited.find((u) => u.id === c.studentId)?.name ?? "New student", status: c.status, createdAt: c.createdAt, package: "" })),
  ];
  if (!open.length) return <Empty title="Every active case has a counselor" />;
  return (
    <ul className="divide-y divide-line">
      {open.map((r) => (
        <li key={r.caseId} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-n-100">{r.student}</p>
            <p className="text-tiny text-n-500"><span className="tabular-nums">Opened {formatDate(r.createdAt)}</span>{r.package && ` · ${r.package}`}</p>
          </div>
          <div className="flex items-center gap-2">
            <CaseStatusChip status={r.status} />
            <Link href={`/admin/students?view=unassigned&case=${r.caseId}`} className={buttonClass("secondary", "sm")}>Assign</Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
