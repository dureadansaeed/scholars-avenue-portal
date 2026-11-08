"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { buttonClass } from "@/components/ui/button-styles";
import { SampleTag, ShortlistStatusChip, Status, Tag } from "@/components/ui/chips";
import { Field, Textarea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Segmented } from "@/components/ui/navigation";
import { Sheet, SidePanel } from "@/components/ui/overlays";
import { Empty, Note, Section } from "@/components/ui/panels";
import { formatDate } from "@/lib/clock";
import { cx } from "@/lib/cx";
import type { getStudentProgrammes } from "@/lib/data/student-journey";
import { deadlineText, money, requirementRows } from "@/lib/program-format";
import { useLocalState } from "@/lib/use-local-state";
import type { ShortlistStatus } from "@/types";

type Item = Awaited<ReturnType<typeof getStudentProgrammes>>[number];
type Decision = { status: ShortlistStatus; feedback?: string };
type Filter = "all" | "decide" | "approved" | "declined";

const group = (s: ShortlistStatus): Filter =>
  s === "shared" || s === "under_discussion" ? "decide" : s === "student_declined" ? "declined" : "approved";

export function ProgrammesView({ studentId, items }: { studentId: string; items: Item[] }) {
  const [decisions, setDecisions] = useLocalState<Record<string, Decision>>(`sa:decisions:${studentId}`, {});
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [declining, setDeclining] = useState<Item | null>(null);
  const [text, setText] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const statusOf = (i: Item): ShortlistStatus => decisions[i.id]?.status ?? i.status;
  const feedbackOf = (i: Item) => decisions[i.id]?.feedback ?? i.studentFeedback;
  const counts = {
    all: items.length,
    decide: items.filter((i) => group(statusOf(i)) === "decide").length,
    approved: items.filter((i) => group(statusOf(i)) === "approved").length,
    declined: items.filter((i) => group(statusOf(i)) === "declined").length,
  };
  const shown = items.filter((i) => filter === "all" || group(statusOf(i)) === filter);
  const open = items.find((i) => i.id === openId) ?? null;

  const decide = (i: Item, status: ShortlistStatus, feedback?: string) => {
    setDecisions((d) => ({ ...d, [i.id]: { status, feedback } }));
    setToast(status === "student_approved"
      ? `Thanks. We have noted that you like ${i.programme.name} at ${i.programme.university.name}. Your counselor will be in touch about next steps.`
      : `Noted. We have removed ${i.programme.name} from your list of options.`);
  };

  const submitDecline = () => {
    if (!declining) return;
    decide(declining, "student_declined", text.trim() || undefined);
    setDeclining(null); setText("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Filter programmes" value={filter} onChange={setFilter}
          options={[{ value: "all", label: "All", count: counts.all }, { value: "decide", label: "To decide", count: counts.decide },
            { value: "approved", label: "Approved", count: counts.approved }, { value: "declined", label: "Declined", count: counts.declined }]} />
        <SampleTag />
      </div>

      {toast && <Note tone="ok" action={<button type="button" onClick={() => setToast(null)} className="text-tiny opacity-60 hover:opacity-100">Dismiss</button>}>{toast}</Note>}

      {shown.length === 0 ? (
        <Section><Empty title={items.length === 0 ? "Nothing shared yet" : "Nothing in this view"}>
          {items.length === 0 ? "When your counselor shares a programme with you, it will appear here with their notes." : "Try another filter."}
        </Empty></Section>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {shown.map((i, n) => {
            const p = i.programme;
            const status = statusOf(i);
            const dl = deadlineText(p.intake);
            return (
              <li key={i.id} className={cx("flex flex-col rounded-lg border border-line p-5", ["bg-tint-1", "bg-tint-2", "bg-tint-3", "bg-tint-4"][n % 4])}>
                <div className="flex items-start justify-between gap-3">
                  <ShortlistStatusChip status={status} />
                  <Tag className="bg-surface/70 tabular-nums">{p.intake.name}</Tag>
                </div>
                <h2 className="mt-4 text-lg font-semibold tracking-tight text-n-100">{p.degreeTitle} {p.name}</h2>
                <p className="text-sm text-n-300">{p.university.name}</p>
                <p className="text-tiny text-n-300">{p.city}, {p.country}</p>
                <p className={cx("mt-3 text-tiny tabular-nums", dl.unknown ? "text-warn-400" : "text-n-300")}>
                  {dl.unknown ? "Deadline not published yet" : `Deadline ${dl.value}`}
                </p>
                {i.studentNote && <p className="mt-2 line-clamp-3 text-tiny leading-relaxed text-n-300">{i.studentNote}</p>}
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                  <Button size="sm" variant="primary" onClick={() => setOpenId(i.id)}>View details</Button>
                  {group(status) === "decide" && <Button size="sm" onClick={() => decide(i, "student_approved")}>I like this</Button>}
                  {i.application && <Link href={`/student/applications/${i.application}`} className={buttonClass("secondary", "sm")}>View application</Link>}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <SidePanel open={!!open} onClose={() => setOpenId(null)} title={open ? `${open.programme.degreeTitle} ${open.programme.name}` : ""}
        description={open ? `${open.programme.university.name}, ${open.programme.city}` : undefined}
        footer={open ? (
          <>
            {open && group(statusOf(open)) === "decide" && <>
              <Button onClick={() => { setDeclining(open); setText(""); }}>Not for me</Button>
              <Button variant="primary" onClick={() => decide(open, "student_approved")}>I like this</Button>
            </>}
          </>
        ) : undefined}>
        {open && <Detail item={open} status={statusOf(open)} feedback={feedbackOf(open)} />}
      </SidePanel>

      <Sheet open={!!declining} onClose={() => setDeclining(null)} title="Not for you?"
        description="That is completely fine. A short reason helps your counselor suggest better options."
        footer={<><Button variant="ghost" onClick={() => setDeclining(null)}>Cancel</Button><Button variant="primary" onClick={submitDecline}>Remove this option</Button></>}>
        <Field label="Reason" optional><Textarea data-autofocus rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="For example: the city is too expensive for me." /></Field>
      </Sheet>
    </div>
  );
}

function Detail({ item, status, feedback }: { item: Item; status: ShortlistStatus; feedback: string | null | undefined }) {
  const p = item.programme;
  const rows = [...requirementRows(p), deadlineText(p.intake)];
  const fee = money(p.intake.applicationFee);
  const tuition = p.intake.tuition ? `${money(p.intake.tuition)} per ${p.intake.tuition.per}` : null;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2"><ShortlistStatusChip status={status} /><SampleTag /></div>
      {item.studentNote && <Note title="From your counselor">{item.studentNote}</Note>}
      {feedback && <Note tone="ok" title="Your feedback">{feedback}</Note>}

      <dl className="divide-y divide-line rounded-md border border-line text-sm">
        {[["Intake", p.intake.name], ["Subject", p.subject], ["Duration", p.durationMonths ? `${p.durationMonths} months, ${p.studyMode.replace("_", "-")}` : "Not confirmed yet"],
          ["Language of instruction", p.languages.join(", ")], ["Route", p.intake.route ? (p.intake.route.portalName ?? p.intake.route.type.replace(/_/g, " ")) : "Not confirmed yet"],
          ["Application fee", fee ?? "Not confirmed yet"], ["Tuition", tuition ?? "Not confirmed yet"],
          ["Scholarships", p.scholarshipAvailable == null ? "Not confirmed yet" : p.scholarshipAvailable ? "Available, ask your counselor" : "None known"],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-4 py-2.5"><dt className="text-n-400">{k}</dt>
            <dd className={cx("text-right text-n-100", v === "Not confirmed yet" && "text-n-500")}>{v}</dd></div>
        ))}
      </dl>

      <div>
        <h3 className="mb-2 text-sm font-semibold tracking-tight text-n-100">Entry requirements</h3>
        <dl className="divide-y divide-line rounded-md border border-line text-sm">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between gap-4 px-4 py-2.5">
              <dt className="text-n-400">{r.label}</dt>
              <dd className={cx("max-w-[60%] text-right", r.unknown ? "text-warn-400" : "text-n-100")}>{r.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-tiny leading-relaxed text-n-500">
          These are the programme&apos;s published requirements, not a promise of admission. Your counselor checks them against your profile and will tell you where you stand.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-tiny text-n-500">
        <Status tone={p.verification === "verified" ? "ok" : "warn"}>{p.verification === "verified" ? "Checked against the official source" : "Not yet checked against the official source"}</Status>
        {p.lastCheckedAt && <span className="tabular-nums">Last checked {formatDate(p.lastCheckedAt)}</span>}
        {p.sourceUrl && <a href={p.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-link hover:underline"><Icon.Link className="size-3" />Official page</a>}
      </div>
    </div>
  );
}
