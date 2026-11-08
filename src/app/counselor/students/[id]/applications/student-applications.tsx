"use client";

import Link from "next/link";
import { buttonClass } from "@/components/ui/button-styles";
import { ApplicationStatusChip, SampleTag } from "@/components/ui/chips";
import { Empty, Note, Section } from "@/components/ui/panels";
import { GROUP_LABEL, isActive, STATUS_LABEL, statusGroup } from "@/lib/application-rules";
import { formatDate } from "@/lib/clock";
import { mergeById, useCounselorWork } from "@/lib/counselor-work";
import type { getStudentWorkBundle } from "@/lib/data/counselor-work";
import { ROUTE_LABEL } from "@/lib/student-labels";

type Bundle = NonNullable<Awaited<ReturnType<typeof getStudentWorkBundle>>>;

export function StudentApplications({ counselorId, bundle }: { counselorId: string; bundle: Bundle }) {
  const w = useCounselorWork(counselorId);
  const apps = mergeById(bundle.applications, w.work.applications).filter((a) => a.studentId === bundle.student.id);
  const limit = bundle.package.maxApplications;
  const used = apps.filter((a) => a.status !== "withdrawn" && a.status !== "closed").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-n-300"><span className="tabular-nums font-medium text-n-100">{apps.length}</span> application{apps.length === 1 ? "" : "s"}
          {limit != null && <span className="text-n-500"> · package allows {limit} ({bundle.package.name})</span>}</p>
        <Link href={`/counselor/students/${bundle.student.id}/shortlist`} className={buttonClass("secondary", "md")}>Create one from the shortlist</Link>
      </div>
      {limit != null && used >= limit && <Note tone="warn" title="At the package limit">Another application needs an approved exception.</Note>}

      {apps.length === 0 ? (
        <Section><Empty title="No applications yet">Applications start from a shortlisted programme the student agrees to.</Empty></Section>
      ) : (
        <ul className="space-y-3">
          {apps.map((a) => {
            const p = bundle.programs.find((x) => x.id === a.programId)!;
            const i = p.intakes.find((x) => x.id === a.intakeId)!;
            const u = bundle.universities.find((x) => x.id === p.universityId)!;
            return (
              <li key={a.id}>
                <Link href={`/counselor/applications/${a.id}`} className="press block rounded-lg border border-line bg-surface p-5 transition-colors hover:border-line-strong">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold tracking-tight text-n-100">{p.degreeTitle} {p.name}</h2>
                      <p className="text-tiny text-n-400">{u.name} · <span className="tabular-nums">{i.name}</span> · {ROUTE_LABEL[a.route]}</p>
                    </div>
                    <div className="flex items-center gap-2"><SampleTag /><ApplicationStatusChip status={a.status} label={STATUS_LABEL[a.status]} /></div>
                  </div>
                  <p className="mt-2 text-tiny text-n-500">{GROUP_LABEL[statusGroup(a.status)]}{a.startedAt && ` · started ${formatDate(a.startedAt)}`}</p>
                  <p className="mt-1 text-tiny text-n-300">{isActive(a.status) && !a.nextAction?.trim() ? <span className="text-warn-400">No next action set</span> : <>Next: {a.nextAction ?? "none needed"}</>}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
