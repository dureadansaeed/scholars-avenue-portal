"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { HueChip, Status, Tag, TaskStatusChip } from "@/components/ui/chips";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Segmented } from "@/components/ui/navigation";
import { Sheet } from "@/components/ui/overlays";
import { Empty, Note, Section } from "@/components/ui/panels";
import { DEMO_NOW, formatDate, formatDateTime, isPast, relativeDays } from "@/lib/clock";
import { cx } from "@/lib/cx";
import { mergeById, useCounselorWork } from "@/lib/counselor-work";
import { newId } from "@/lib/use-local-state";
import type { DeadlineCategory, Task, TaskStatus } from "@/types";

const CATEGORY: Record<DeadlineCategory, [React.ComponentProps<typeof HueChip>["hue"], string]> = {
  university_application: ["blue", "Application"], scholarship: ["green", "Scholarship"], document: ["amber", "Document"],
  payment: ["orange", "Payment"], test_booking: ["violet", "Test"], internal_review: ["teal", "Review"],
};
const STATUSES: [TaskStatus, string][] = [
  ["open", "Open"], ["in_progress", "In progress"], ["waiting_for_student", "Waiting for student"], ["waiting_for_counselor", "Waiting for you"],
  ["completed", "Completed"], ["cancelled", "Cancelled"],
];
type View = "open" | "waiting" | "done";

/** Tasks for the counselor, and for one student when `fixedStudentId` is set. Overdue is derived from the due date, never stored. */
export function TaskBoard({ counselorId, tasks, students, fixedStudentId }: {
  counselorId: string; tasks: Task[]; students: { id: string; name: string }[]; fixedStudentId?: string;
}) {
  const w = useCounselorWork(counselorId);
  const [view, setView] = useState<View>("open");
  const [student, setStudent] = useState("");
  const [category, setCategory] = useState("");
  const [creating, setCreating] = useState(false);
  const [completing, setCompleting] = useState<Task | null>(null);
  const [evidence, setEvidence] = useState("");

  const all = useMemo(() => mergeById(tasks, w.work.tasks).filter((t) => !fixedStudentId || t.studentId === fixedStudentId), [tasks, w.work.tasks, fixedStudentId]);
  const nameOf = (id: string) => students.find((s) => s.id === id)?.name ?? "Student";
  const isOpen = (t: Task) => t.status !== "completed" && t.status !== "cancelled";
  const filtered = all.filter((t) => (!student || t.studentId === student) && (!category || t.category === category));
  const lists: Record<View, Task[]> = {
    open: filtered.filter((t) => isOpen(t) && t.status !== "waiting_for_student"),
    waiting: filtered.filter((t) => t.status === "waiting_for_student" || (t.kind === "student_action" && isOpen(t))),
    done: filtered.filter((t) => !isOpen(t)),
  };
  const shown = [...lists[view]].sort((a, b) => Date.parse(a.dueDate) - Date.parse(b.dueDate));
  const overdue = filtered.filter((t) => isOpen(t) && isPast(t.dueDate)).length;

  const setStatus = (t: Task, status: TaskStatus) => {
    if (status === "completed") { setCompleting(t); setEvidence(""); return; }
    w.saveTask({ ...t, status, completedAt: undefined });
  };
  const finish = () => {
    if (!completing) return;
    w.saveTask({ ...completing, status: "completed", completedAt: DEMO_NOW, completionNote: evidence.trim() || undefined });
    setCompleting(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Task view" size="sm" value={view} onChange={setView}
          options={[{ value: "open", label: "To do", count: lists.open.length }, { value: "waiting", label: "Waiting on students", count: lists.waiting.length }, { value: "done", label: "Done", count: lists.done.length }]} />
        <div className="flex flex-wrap items-center gap-2">
          {!fixedStudentId && (
            <Select aria-label="Student" className="w-auto" value={student} onChange={(e) => setStudent(e.target.value)}>
              <option value="">All students</option>{students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          )}
          <Select aria-label="Category" className="w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>{Object.entries(CATEGORY).map(([k, [, l]]) => <option key={k} value={k}>{l}</option>)}
          </Select>
          <Button variant="primary" onClick={() => setCreating(true)}><Icon.Plus className="size-4" />New task</Button>
        </div>
      </div>
      {overdue > 0 && view !== "done" && <Note tone="bad" title={`${overdue} overdue`}>Overdue is worked out from the due date, so it clears as soon as the task is done.</Note>}

      <Section flush>
        {shown.length === 0 ? (
          <Empty title={view === "done" ? "Nothing completed yet" : "Nothing here"} action={view !== "done" ? <Button size="sm" onClick={() => setCreating(true)}>Create a task</Button> : undefined}>
            {view === "waiting" ? "Requests you send to students that are still open show up here." : "Tasks you create, and tasks created for your students, appear here."}
          </Empty>
        ) : (
          <ul className="divide-y divide-line">
            {shown.map((t) => {
              const late = isOpen(t) && isPast(t.dueDate);
              const [hue, cat] = CATEGORY[t.category];
              return (
                <li key={t.id} className="flex flex-wrap items-start gap-x-4 gap-y-2 px-5 py-4">
                  <div className="min-w-0 flex-1 basis-64">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={cx("text-sm font-medium", t.status === "completed" ? "text-n-400 line-through" : "text-n-100")}>{t.title}</p>
                      <HueChip hue={hue}>{cat}</HueChip>
                      <Tag>{t.kind === "internal" ? "Yours" : "Student action"}</Tag>
                      {t.priority === "high" && isOpen(t) && <span className="text-micro font-medium tracking-wide text-bad-400 uppercase">High</span>}
                    </div>
                    {t.description && <p className="mt-0.5 text-tiny leading-relaxed text-n-400">{t.description}</p>}
                    <p className="mt-1 text-tiny text-n-500">
                      {!fixedStudentId && <><Link href={`/counselor/students/${t.studentId}`} className="text-n-300 underline underline-offset-2 hover:text-n-100">{nameOf(t.studentId)}</Link> · </>}
                      <span className={cx("tabular-nums", late && "text-bad-400")}>
                        {t.status === "completed" ? `Done ${t.completedAt ? formatDate(t.completedAt) : ""}` : `Due ${t.dueDateOnly ? formatDate(t.dueDate) : formatDateTime(t.dueDate)} · ${relativeDays(t.dueDate)}`}
                      </span>
                      {t.completionNote && <span> · “{t.completionNote}”</span>}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {late ? <Status tone="bad">Overdue</Status> : <TaskStatusChip status={t.status} />}
                    <Select aria-label={`Status of ${t.title}`} className="w-40" value={t.status} onChange={(e) => setStatus(t, e.target.value as TaskStatus)}>
                      {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </Select>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {creating && <CreateTask students={students} fixed={fixedStudentId} onClose={() => setCreating(false)}
        onCreate={(t) => { w.saveTask({ ...t, id: newId("tsk"), createdBy: counselorId, ownerId: t.kind === "internal" ? counselorId : t.studentId }); setCreating(false); }} />}

      <Sheet open={!!completing} onClose={() => setCompleting(null)} title="Mark as completed" description={completing?.title}
        footer={<><Button variant="ghost" onClick={() => setCompleting(null)}>Cancel</Button><Button variant="primary" onClick={finish}>Mark completed</Button></>}>
        <Field label="Completion note" optional hint="What was done, or where the evidence is. Kept with the task."><Textarea data-autofocus rows={3} value={evidence} onChange={(e) => setEvidence(e.target.value)} /></Field>
      </Sheet>
    </div>
  );
}

function CreateTask({ students, fixed, onClose, onCreate }: {
  students: { id: string; name: string }[]; fixed?: string; onClose: () => void; onCreate: (t: Omit<Task, "id" | "createdBy">) => void;
}) {
  const [f, setF] = useState({ studentId: fixed ?? "", kind: "internal" as Task["kind"], title: "", description: "", category: "internal_review" as DeadlineCategory, priority: "normal" as Task["priority"], date: "", time: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  const submit = () => {
    const e: Record<string, string> = {};
    if (!f.studentId) e.studentId = "Choose the student this is about.";
    if (f.title.trim().length < 3) e.title = "Give the task a short title.";
    if (!f.date) e.date = "Set a due date.";
    else if (f.date < DEMO_NOW.slice(0, 10)) e.date = "The due date cannot be in the past.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const dateOnly = !f.time;
    onCreate({
      studentId: f.studentId, title: f.title.trim(), description: f.description.trim() || undefined, kind: f.kind,
      ownerId: f.kind === "internal" ? "" : f.studentId, status: "open", priority: f.priority, category: f.category,
      dueDate: dateOnly ? f.date : `${f.date}T${f.time}:00Z`, dueDateOnly: dateOnly,
    });
  };

  return (
    <Sheet open onClose={onClose} title="New task" description="For yourself, or a request the student sees as a task with this due date."
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={submit}>Create task</Button></>}>
      <div className="space-y-4">
        {!fixed && <Field label="Student" required error={errors.studentId}>
          <Select value={f.studentId} onChange={(e) => set("studentId", e.target.value)}><option value="">Choose…</option>{students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>}
        <Field label="Who does it" required>
          <Select value={f.kind} onChange={(e) => set("kind", e.target.value as Task["kind"])}><option value="internal">I do (staff only)</option><option value="student_action">The student does</option></Select>
        </Field>
        <Field label="Title" required error={errors.title}><Input data-autofocus value={f.title} onChange={(e) => set("title", e.target.value)} /></Field>
        <Field label="Details" optional><Textarea rows={2} value={f.description} onChange={(e) => set("description", e.target.value)} /></Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Category" required><Select value={f.category} onChange={(e) => set("category", e.target.value as DeadlineCategory)}>{Object.entries(CATEGORY).map(([k, [, l]]) => <option key={k} value={k}>{l}</option>)}</Select></Field>
          <Field label="Priority"><Select value={f.priority} onChange={(e) => set("priority", e.target.value as Task["priority"])}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></Select></Field>
          <Field label="Due date" required error={errors.date}><Input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} /></Field>
          <Field label="Time (UTC)" optional hint="Leave empty for a date-only deadline."><Input type="time" value={f.time} onChange={(e) => set("time", e.target.value)} /></Field>
        </div>
        {f.kind === "student_action" && <Note>The student sees this as a task with the due date. Anything staff-only should be a task for yourself.</Note>}
      </div>
    </Sheet>
  );
}
