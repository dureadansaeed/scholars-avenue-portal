"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HueChip, TaskStatusChip } from "@/components/ui/chips";
import { Field, Textarea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Segmented } from "@/components/ui/navigation";
import { Sheet } from "@/components/ui/overlays";
import { Empty, Note, Section } from "@/components/ui/panels";
import { DEMO_NOW, formatDate, isPast, relativeDays } from "@/lib/clock";
import { cx } from "@/lib/cx";
import type { getStudentTasks } from "@/lib/data/student-journey";
import { useLocalState } from "@/lib/use-local-state";
import type { DeadlineCategory } from "@/types";

type Task = Awaited<ReturnType<typeof getStudentTasks>>[number];
type Done = Record<string, { at: string; note?: string }>;

const CATEGORY: Record<DeadlineCategory, [React.ComponentProps<typeof HueChip>["hue"], string]> = {
  university_application: ["blue", "Application"], scholarship: ["green", "Scholarship"], document: ["amber", "Document"],
  payment: ["orange", "Payment"], test_booking: ["violet", "Test"], internal_review: ["teal", "Review"],
};
const href = (t: Task) => t.related?.type === "document" ? "/student/documents" : t.related?.type === "profile" ? "/student/profile"
  : t.related?.type === "application" ? `/student/applications/${t.related.id}` : undefined;

export function TasksView({ studentId, tasks }: { studentId: string; tasks: Task[] }) {
  const [done, setDone] = useLocalState<Done>(`sa:tasks:${studentId}`, {});
  const [view, setView] = useState<"open" | "done">("open");
  const [completing, setCompleting] = useState<Task | null>(null);
  const [note, setNote] = useState("");

  const isDone = (t: Task) => t.status === "completed" || !!done[t.id];
  const open = tasks.filter((t) => !isDone(t) && t.status !== "cancelled");
  const finished = tasks.filter(isDone);
  const list = view === "open" ? open : finished;
  const overdue = open.filter((t) => isPast(t.dueDate)).length;

  const complete = () => {
    if (!completing) return;
    setDone((d) => ({ ...d, [completing.id]: { at: DEMO_NOW, note: note.trim() || undefined } }));
    setCompleting(null); setNote("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Task view" value={view} onChange={setView}
          options={[{ value: "open", label: "To do", count: open.length }, { value: "done", label: "Done", count: finished.length }]} />
      </div>
      {view === "open" && overdue > 0 && <Note tone="bad" title={`${overdue} ${overdue === 1 ? "task is" : "tasks are"} overdue`}>Please do these first, or message your counselor if you need more time.</Note>}

      <Section flush>
        {list.length === 0 ? (
          <Empty title={view === "open" ? "You are all caught up" : "Nothing completed yet"}>
            {view === "open" ? "New tasks from your counselor will appear here and in your notifications." : "Tasks you finish will be listed here."}
          </Empty>
        ) : (
          <ul className="divide-y divide-line">
            {list.map((t) => {
              const finishedNow = isDone(t);
              const link = href(t);
              const [hue, cat] = CATEGORY[t.category];
              const late = !finishedNow && isPast(t.dueDate);
              return (
                <li key={t.id} className="flex items-start gap-3 px-5 py-4">
                  <button type="button" disabled={finishedNow} aria-label={finishedNow ? `${t.title} (done)` : `Mark ${t.title} as done`}
                    onClick={() => { setCompleting(t); setNote(""); }}
                    className={cx("press mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border",
                      finishedNow ? "border-ok-400 bg-ok-400 text-n-950" : "border-line-strong text-transparent hover:border-ok-400 hover:text-ok-400")}>
                    <Icon.Check className="size-3" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={cx("text-sm font-medium", finishedNow ? "text-n-400 line-through" : "text-n-100")}>{t.title}</p>
                      <HueChip hue={hue}>{cat}</HueChip>
                      {t.priority === "high" && !finishedNow && <span className="text-micro font-medium tracking-wide text-bad-400 uppercase">High priority</span>}
                    </div>
                    {t.description && <p className="mt-0.5 text-tiny leading-relaxed text-n-400">{t.description}</p>}
                    <p className={cx("mt-1 text-tiny tabular-nums", late ? "text-bad-400" : "text-n-500")}>
                      {finishedNow ? `Done ${formatDate(done[t.id]?.at ?? t.completedAt ?? t.dueDate)}` : `Due ${formatDate(t.dueDate)} · ${relativeDays(t.dueDate)}`}
                      {(done[t.id]?.note ?? t.completionNote) && ` · “${done[t.id]?.note ?? t.completionNote}”`}
                    </p>
                    {!finishedNow && link && <Link href={link} className="mt-1.5 inline-block text-tiny font-medium text-link hover:underline">Go to it</Link>}
                  </div>
                  <TaskStatusChip status={finishedNow ? "completed" : t.status} overdue={late} />
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Sheet open={!!completing} onClose={() => setCompleting(null)} title="Mark as done" description={completing?.title}
        footer={<><Button variant="ghost" onClick={() => setCompleting(null)}>Cancel</Button><Button variant="primary" onClick={complete}>Mark as done</Button></>}>
        <div className="space-y-4">
          {completing?.related?.type === "document" && <Note>If this task is about a document, upload it on the Documents page first so your counselor can review it.</Note>}
          <Field label="Note for your counselor" optional hint="For example: sent by email, or what you changed."><Textarea data-autofocus rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        </div>
      </Sheet>
    </div>
  );
}
