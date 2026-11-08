"use client";

import { useMemo, useState } from "react";
import { Status } from "@/components/ui/chips";
import { Empty, Section } from "@/components/ui/panels";
import { Segmented } from "@/components/ui/navigation";
import { STATUS_LABEL } from "@/lib/application-rules";
import { formatDate } from "@/lib/clock";
import { cx } from "@/lib/cx";
import { mergeById, useCounselorWork } from "@/lib/counselor-work";
import type { getStudentWorkBundle } from "@/lib/data/counselor-work";
import { SHORTLIST_LABEL } from "../shortlist/shortlist-view";

type Bundle = NonNullable<Awaited<ReturnType<typeof getStudentWorkBundle>>>;
interface Ev { id: string; at: string; title: string; detail?: string; visibility: "student" | "staff" }

/**
 * Everything that has happened on this case, newest first. Each event says
 * whether the student can see it; staff-only events (internal proposals,
 * private notes) are marked so they are never confused with what the student sees.
 */
export function StudentTimeline({ counselorId, base, bundle }: { counselorId: string; base: Ev[]; bundle: Bundle }) {
  const w = useCounselorWork(counselorId);
  const [filter, setFilter] = useState<"all" | "student" | "staff">("all");

  const events = useMemo(() => {
    const out: Ev[] = [...base];
    const prog = (id: string) => bundle.programs.find((p) => p.id === id);
    for (const e of mergeById(bundle.entries, w.work.shortlist).filter((x) => x.studentId === bundle.student.id)) {
      const p = prog(e.programId);
      e.history.forEach((h, i) => out.push({
        id: `${e.id}-${i}`, at: h.at, title: `${p?.degreeTitle} ${p?.name}: ${SHORTLIST_LABEL[h.status][1].toLowerCase()}`, detail: h.reason,
        // Only the moments the student is part of are visible to them.
        visibility: h.status === "proposed_internally" || h.status === "unsuitable" || h.status === "removed" ? "staff" : "student",
      }));
    }
    for (const a of mergeById(bundle.applications, w.work.applications).filter((x) => x.studentId === bundle.student.id)) {
      const p = prog(a.programId);
      a.history.forEach((h, i) => out.push({ id: `${a.id}-${i}`, at: h.at, title: `${p?.name}: ${STATUS_LABEL[h.to]}`, detail: h.reason, visibility: "student" }));
    }
    return out.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  }, [base, bundle, w.work.shortlist, w.work.applications]);

  const shown = events.filter((e) => filter === "all" || e.visibility === filter);

  return (
    <div className="space-y-4">
      <Segmented label="Visibility" size="sm" value={filter} onChange={setFilter}
        options={[{ value: "all", label: "Everything", count: events.length }, { value: "student", label: "Student can see", count: events.filter((e) => e.visibility === "student").length }, { value: "staff", label: "Staff only", count: events.filter((e) => e.visibility === "staff").length }]} />
      <Section>
        {shown.length === 0 ? <Empty title="No events" /> : (
          <ol className="relative space-y-5 border-l border-line pl-5">
            {shown.map((e) => (
              <li key={e.id} className="relative">
                <span aria-hidden className={cx("absolute top-1.5 -left-[25px] size-2 rounded-full border bg-surface", e.visibility === "staff" ? "border-warn-400" : "border-line-strong")} />
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm text-n-100">{e.title}</p>
                  {e.visibility === "staff" && <Status tone="warn">Staff only</Status>}
                </div>
                {e.detail && <p className="text-tiny leading-relaxed text-n-400">{e.detail}</p>}
                <time dateTime={e.at} className="text-tiny tabular-nums text-n-500">{formatDate(e.at)}</time>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </div>
  );
}
