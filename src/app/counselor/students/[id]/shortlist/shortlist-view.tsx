"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CompareSheet } from "@/app/counselor/programs/compare-sheet";
import { Button } from "@/components/ui/button";
import { buttonClass } from "@/components/ui/button-styles";
import { MatchChip, SampleTag, Status } from "@/components/ui/chips";
import { Field, Textarea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Segmented } from "@/components/ui/navigation";
import { Sheet } from "@/components/ui/overlays";
import { Empty, Note, Section } from "@/components/ui/panels";
import { formatDate } from "@/lib/clock";
import { cx } from "@/lib/cx";
import { mergeById, SHORTLIST_NEXT, useCounselorWork } from "@/lib/counselor-work";
import type { getStudentWorkBundle } from "@/lib/data/counselor-work";
import { matchProgram } from "@/lib/eligibility";
import { deadlineText } from "@/lib/program-format";
import { flatten } from "@/lib/program-search";
import type { ShortlistEntry, ShortlistStatus } from "@/types";
import { CreateApplication } from "./create-application";

type Bundle = NonNullable<Awaited<ReturnType<typeof getStudentWorkBundle>>>;
type View = "all" | "internal" | "student" | "decided" | "closed";

export const SHORTLIST_LABEL: Record<ShortlistStatus, [React.ComponentProps<typeof Status>["tone"], string]> = {
  proposed_internally: ["neutral", "Proposed internally"], shared: ["info", "Shared with student"], under_discussion: ["info", "Under discussion"],
  student_approved: ["ok", "Student approved"], student_declined: ["neutral", "Student declined"], unsuitable: ["neutral", "Unsuitable"],
  application_created: ["ok", "Application created"], removed: ["neutral", "Removed"],
};
const GROUP: Record<ShortlistStatus, Exclude<View, "all">> = {
  proposed_internally: "internal", shared: "student", under_discussion: "student", student_approved: "decided", student_declined: "decided",
  application_created: "decided", unsuitable: "closed", removed: "closed",
};
const ACTION: Record<ShortlistStatus, string> = {
  proposed_internally: "Move back to internal", shared: "Share with student", under_discussion: "Mark under discussion", student_approved: "Record: student approved",
  student_declined: "Record: student declined", unsuitable: "Mark unsuitable…", application_created: "", removed: "Remove…",
};
const NEEDS_REASON = new Set<ShortlistStatus>(["unsuitable", "removed", "student_declined"]);
const TAKES_FEEDBACK = new Set<ShortlistStatus>(["student_approved", "student_declined", "under_discussion"]);

export function ShortlistView({ counselorId, bundle }: { counselorId: string; bundle: Bundle }) {
  const router = useRouter();
  const w = useCounselorWork(counselorId);
  const [view, setView] = useState<View>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [moving, setMoving] = useState<{ entry: ShortlistEntry; to: ShortlistStatus } | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string>();
  const [editing, setEditing] = useState<ShortlistEntry | null>(null);
  const [edit, setEdit] = useState({ reason: "", counselorNote: "", studentNote: "" });
  const [creating, setCreating] = useState<ShortlistEntry | null>(null);
  const [comparing, setComparing] = useState(false);

  const entries = useMemo(() => mergeById(bundle.entries, w.work.shortlist).filter((e) => e.studentId === bundle.student.id).sort((a, b) => Date.parse(b.history.at(-1)?.at ?? "") - Date.parse(a.history.at(-1)?.at ?? "")), [bundle, w.work.shortlist]);
  const rows = useMemo(() => flatten(bundle), [bundle]);
  const rowOf = (e: ShortlistEntry) => rows.find((r) => r.program.id === e.programId && r.intake.id === e.intakeId)!;
  const counts = { all: entries.length, internal: 0, student: 0, decided: 0, closed: 0 } as Record<View, number>;
  entries.forEach((e) => { counts[GROUP[e.status]]++; });
  const shown = entries.filter((e) => view === "all" || GROUP[e.status] === view);

  const appCount = mergeById(bundle.applications, w.work.applications).filter((a) => a.studentId === bundle.student.id && a.status !== "withdrawn" && a.status !== "closed").length;
  const compare = selected.map((id) => entries.find((e) => e.id === id)).filter(Boolean).map((e) => {
    const row = rowOf(e!); return { row, match: matchProgram(bundle.facts, row.program, row.intake.id) };
  });

  const begin = (entry: ShortlistEntry, to: ShortlistStatus) => {
    if (!NEEDS_REASON.has(to) && !TAKES_FEEDBACK.has(to)) { w.moveEntry(entry, to); return; }
    setMoving({ entry, to }); setText(""); setError(undefined);
  };
  const confirm = () => {
    if (!moving) return;
    if (NEEDS_REASON.has(moving.to) && text.trim().length < 5) { setError(moving.to === "student_declined" ? "Record what the student said, or why they declined." : "A reason is required and stays in the history."); return; }
    const isDecision = moving.to === "student_approved" || moving.to === "student_declined" || moving.to === "under_discussion";
    w.moveEntry(moving.entry, moving.to, text.trim() || undefined, isDecision ? text.trim() || undefined : undefined);
    setMoving(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Shortlist view" size="sm" value={view} onChange={setView}
          options={[{ value: "all", label: "All", count: counts.all }, { value: "internal", label: "Internal", count: counts.internal }, { value: "student", label: "With student", count: counts.student },
            { value: "decided", label: "Decided", count: counts.decided }, { value: "closed", label: "Closed", count: counts.closed }]} />
        <div className="flex items-center gap-2">
          <Button disabled={selected.length < 2} onClick={() => setComparing(true)}>Compare{selected.length >= 2 ? ` (${selected.length})` : ""}</Button>
          <Link href={`/counselor/programs?student=${bundle.student.id}`} className={buttonClass("primary", "md")}><Icon.Plus className="size-4" />Find programmes</Link>
        </div>
      </div>

      {shown.length === 0 ? (
        <Section><Empty title={entries.length ? "Nothing in this view" : "No programmes shortlisted yet"} action={!entries.length ? <Link href={`/counselor/programs?student=${bundle.student.id}`} className={buttonClass("primary", "sm")}>Search the program bank</Link> : undefined}>
          {entries.length ? "Try another view." : "Search the program bank with this student selected to see how each programme compares with their record."}
        </Empty></Section>
      ) : (
        <ul className="space-y-4">
          {shown.map((e) => {
            const row = rowOf(e);
            const match = matchProgram(bundle.facts, row.program, row.intake.id);
            const [tone, label] = SHORTLIST_LABEL[e.status];
            const dl = deadlineText(row.intake);
            const app = Object.values(w.work.applications).find((a) => a.studentId === e.studentId && a.programId === e.programId && a.intakeId === e.intakeId)
              ?? bundle.applications.find((a) => a.programId === e.programId && a.intakeId === e.intakeId);
            const canCreate = ["shared", "under_discussion", "student_approved"].includes(e.status);
            return (
              <li key={e.id} className={cx("rounded-lg border border-line bg-surface", (e.status === "removed" || e.status === "unsuitable") && "opacity-75")}>
                <div className="flex flex-wrap items-start gap-3 px-5 py-4">
                  <input type="checkbox" className="mt-1.5 size-4 accent-blue-500" aria-label={`Select ${row.program.name} to compare`} checked={selected.includes(e.id)}
                    disabled={!selected.includes(e.id) && selected.length >= 4} onChange={() => setSelected((s) => (s.includes(e.id) ? s.filter((x) => x !== e.id) : [...s, e.id]))} />
                  <div className="min-w-0 flex-1 basis-72">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold tracking-tight text-n-100">{row.program.degreeTitle} {row.program.name}</h2>
                      <Status tone={tone}>{label}</Status><SampleTag />
                    </div>
                    <p className="text-tiny text-n-400">{row.university.name}, {row.city.name} · <span className="tabular-nums">{row.intake.name}</span> · <span className={cx("tabular-nums", dl.unknown && "text-warn-400")}>{dl.unknown ? "Deadline not published" : `Deadline ${dl.value}`}</span></p>
                    <div className="mt-2 flex flex-wrap items-center gap-2"><MatchChip overall={match.overall} /><span className="text-tiny text-n-500">System check, not a decision</span></div>
                  </div>
                  <div className="flex w-full flex-wrap items-center gap-1.5 pl-7">
                    {SHORTLIST_NEXT[e.status].map((to) => <Button key={to} size="sm" variant={to === "shared" || to === "student_approved" ? "primary" : "secondary"} onClick={() => begin(e, to)}>{ACTION[to]}</Button>)}
                    {canCreate && !app && <Button size="sm" variant={e.status === "student_approved" ? "primary" : "secondary"} onClick={() => setCreating(e)}>Create application</Button>}
                    {app && <Link href={`/counselor/applications/${app.id}`} className={buttonClass("secondary", "sm")}>Open application</Link>}
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(e); setEdit({ reason: e.reason, counselorNote: e.counselorNote ?? "", studentNote: e.studentNote ?? "" }); }}><Icon.Edit className="size-3.5" />Notes</Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 border-t border-line px-5 py-4 text-tiny md:grid-cols-2">
                  <div>
                    <p className="flex items-center gap-1.5 text-micro font-medium tracking-wide text-n-500 uppercase"><Icon.Lock className="size-3" />Staff only</p>
                    <p className="mt-1 leading-relaxed text-n-200"><span className="text-n-500">Why: </span>{e.reason}</p>
                    {e.counselorNote && <p className="mt-1 whitespace-pre-line leading-relaxed text-n-300">{e.counselorNote}</p>}
                  </div>
                  <div>
                    <p className="text-micro font-medium tracking-wide text-n-500 uppercase">{GROUP[e.status] === "internal" || e.status === "unsuitable" ? "Student will see once shared" : "Student can see"}</p>
                    <p className={cx("mt-1 leading-relaxed", e.studentNote ? "text-n-200" : "text-n-500")}>{e.studentNote ?? "No note for the student."}</p>
                    {e.studentFeedback && <p className="mt-1.5 leading-relaxed text-n-200"><span className="text-n-500">Student said: </span>{e.studentFeedback}</p>}
                  </div>
                </div>

                <details className="border-t border-line px-5 py-2.5 text-tiny text-n-400">
                  <summary className="cursor-pointer text-n-500 hover:text-n-100">History ({e.history.length})</summary>
                  <ol className="mt-2 space-y-1.5 pb-1">
                    {[...e.history].reverse().map((h, i) => (
                      <li key={i} className="tabular-nums"><span className="text-n-500">{formatDate(h.at)}</span> · {SHORTLIST_LABEL[h.status][1]}{h.reason && <span className="text-n-500"> · {h.reason}</span>}</li>
                    ))}
                  </ol>
                </details>
              </li>
            );
          })}
        </ul>
      )}

      <Sheet open={!!moving} onClose={() => setMoving(null)} title={moving ? ACTION[moving.to].replace("…", "") : ""}
        description={moving ? `${rowOf(moving.entry).program.name}, ${rowOf(moving.entry).university.name}` : undefined}
        footer={<><Button variant="ghost" onClick={() => setMoving(null)}>Cancel</Button><Button variant="primary" onClick={confirm}>Save</Button></>}>
        {moving && (
          <Field label={moving.to === "student_approved" || moving.to === "student_declined" || moving.to === "under_discussion" ? "What the student said" : "Reason"}
            required={NEEDS_REASON.has(moving.to)} optional={!NEEDS_REASON.has(moving.to)} error={error}
            hint={moving.to === "removed" || moving.to === "unsuitable" ? "Kept in the shortlist history." : "Recorded with the date, as the student's own words where you can."}>
            <Textarea data-autofocus rows={4} value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
        )}
      </Sheet>

      <Sheet open={!!editing} onClose={() => setEditing(null)} title="Edit notes" description="Keep staff and student notes separate."
        footer={<><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="primary" onClick={() => { if (editing && edit.reason.trim()) { w.editNotes(editing, { reason: edit.reason.trim(), counselorNote: edit.counselorNote.trim() || undefined, studentNote: edit.studentNote.trim() || undefined }); setEditing(null); } }}>Save</Button></>}>
        <div className="space-y-4">
          <Field label="Why this programme (staff)" required><Textarea rows={2} value={edit.reason} onChange={(e) => setEdit({ ...edit, reason: e.target.value })} /></Field>
          <Field label="Staff note" optional><Textarea rows={3} value={edit.counselorNote} onChange={(e) => setEdit({ ...edit, counselorNote: e.target.value })} /></Field>
          <Field label="Note the student can see" optional hint="No internal remarks here."><Textarea rows={3} value={edit.studentNote} onChange={(e) => setEdit({ ...edit, studentNote: e.target.value })} /></Field>
        </div>
      </Sheet>

      {creating && (
        <CreateApplication program={rowOf(creating).program} intake={rowOf(creating).intake} studentName={bundle.student.name} existingCount={appCount}
          limit={bundle.package.maxApplications} unconfirmed={creating.status !== "student_approved"} onClose={() => setCreating(null)}
          onCreate={(a) => { const app = w.createApplication({ entry: creating, program: rowOf(creating).program, ...a }); setCreating(null); router.push(`/counselor/applications/${app.id}`); }} />
      )}
      {comparing && compare.length >= 2 && <CompareSheet open onClose={() => setComparing(false)} items={compare} studentName={bundle.student.name} />}

      <Note>Sharing makes an entry visible to the student with only the note meant for them. Staff notes and your reasons never leave this screen.</Note>
    </div>
  );
}

