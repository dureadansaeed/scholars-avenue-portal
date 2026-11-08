"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ApplicationStatusChip, SampleTag, Status, Tag } from "@/components/ui/chips";
import { Timeline } from "@/components/ui/domain";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Disclosure } from "@/components/ui/navigation";
import { Sheet } from "@/components/ui/overlays";
import { Empty, Metric, Note, Section } from "@/components/ui/panels";
import { GROUP_LABEL, isActive, STATUS_LABEL, statusGroup, takeSnapshot } from "@/lib/application-rules";
import { DEMO_NOW, daysUntil, formatDate } from "@/lib/clock";
import { cx } from "@/lib/cx";
import { useCounselorWork } from "@/lib/counselor-work";
import type { getApplicationBundle } from "@/lib/data/counselor-work";
import { deadlineText, money } from "@/lib/program-format";
import { ROUTE_LABEL } from "@/lib/student-labels";
import { newId, useLocalState } from "@/lib/use-local-state";
import type { Application, ApplicationRequirement, ApplicationRouteType } from "@/types";
import { StatusSheet } from "./status-sheet";

type Bundle = NonNullable<Awaited<ReturnType<typeof getApplicationBundle>>>;
const NEXT_ITEM: Record<ApplicationRequirement["status"], ApplicationRequirement["status"]> = { pending: "in_review", in_review: "done", done: "pending" };

export function ApplicationWorkspace({ counselorId, bundle }: { counselorId: string; bundle: Bundle }) {
  const w = useCounselorWork(counselorId);
  const [confirmedAt] = useLocalState<string | null>(`sa:confirm:${bundle.student.id}:${bundle.id}`, null);
  const [changing, setChanging] = useState(false);
  const [editing, setEditing] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [action, setAction] = useState<{ text: string; due: string } | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [reason, setReason] = useState("");

  const app: Application | null = w.work.applications[bundle.id] ?? bundle.base;
  const checklist = w.work.checklists[bundle.id] ?? bundle.baseChecklist ?? [];
  const program = bundle.program;
  const intake = program.intakes.find((i) => i.id === bundle.intakeId)!;

  if (!app) {
    return <Section><Empty title="This application is not available here" action={<Link href="/counselor/applications" className="text-sm font-medium text-link hover:underline">Back to applications</Link>}>
      New applications are saved in the browser they were created in. Open it from there, or create it again from the student&apos;s shortlist.</Empty></Section>;
  }

  const dl = deadlineText(intake);
  const active = isActive(app.status);
  const noNext = active && !app.nextAction?.trim();
  const mine = checklist.filter((c) => c.owner === "student");
  const ours = checklist.filter((c) => c.owner === "counselor");
  const done = checklist.filter((c) => c.status === "done").length;
  const snap = app.snapshot;

  const save = (patch: Partial<Application>) => w.saveApplication({ ...app, ...patch });
  const toggle = (item: ApplicationRequirement) => w.saveChecklist(bundle.id, checklist.map((c) => (c.id === item.id ? { ...c, status: NEXT_ITEM[c.status] } : c)));

  const Item = ({ c }: { c: ApplicationRequirement }) => (
    <li className="flex items-start gap-3 px-5 py-3">
      <button type="button" onClick={() => toggle(c)} aria-label={`${c.label}: ${c.status.replace("_", " ")}. Click to change.`}
        className={cx("press mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border",
          c.status === "done" ? "border-ok-400 bg-ok-400 text-n-950" : c.status === "in_review" ? "border-blue-500 text-link" : "border-line-strong text-transparent")}>
        {c.status === "in_review" ? <span className="size-2 rounded-full bg-blue-500" /> : <Icon.Check className="size-3" />}
      </button>
      <span className="min-w-0 flex-1">
        <span className={cx("block text-sm", c.status === "done" ? "text-n-400" : "text-n-100")}>{c.label}</span>
        <span className="block text-tiny text-n-500">{c.owner === "student" ? "Student" : "You"}</span>
      </span>
      <Status tone={c.status === "done" ? "ok" : c.status === "in_review" ? "info" : "neutral"}>{c.status === "done" ? "Done" : c.status === "in_review" ? "In review" : "To do"}</Status>
    </li>
  );

  return (
    <div className="space-y-4">
      <nav aria-label="Breadcrumb" className="text-tiny text-n-500">
        <Link href="/counselor/applications" className="hover:text-n-100">Applications</Link> <span aria-hidden>/</span> <Link href={`/counselor/students/${bundle.student.id}/applications`} className="hover:text-n-100">{bundle.student.name}</Link>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-n-100">{program.degreeTitle} {program.name}</h1>
          <p className="mt-1 text-base text-n-400">{bundle.university}, {bundle.city} · <span className="tabular-nums">{intake.name}</span> · for <Link href={`/counselor/students/${bundle.student.id}`} className="text-n-200 underline underline-offset-2 hover:text-n-100">{bundle.student.name}</Link></p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ApplicationStatusChip status={app.status} label={STATUS_LABEL[app.status]} />{GROUP_LABEL[statusGroup(app.status)].toLowerCase() !== STATUS_LABEL[app.status].toLowerCase() && <Tag>{GROUP_LABEL[statusGroup(app.status)]}</Tag>}<SampleTag />
            <span className="text-tiny text-n-500">Student sees: “{app.studentStatusLabel}”</span>
          </div>
        </div>
        <Button variant="primary" onClick={() => setChanging(true)} disabled={app.status === "closed"}>Change status</Button>
      </header>

      {noNext && <Note tone="warn" title="No next action">Every active application needs a next action, or a clear reason none is needed.</Note>}
      {bundle.package.maxApplications != null && <p className="sr-only">Package limit {bundle.package.maxApplications}</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Section title="Next action" description="What happens next, who does it, and by when.">
            {action ? (
              <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save({ nextAction: action.text.trim() || undefined, nextActionDue: action.due || undefined }); setAction(null); }}>
                <Field label="Next action" required={active}><Input data-autofocus value={action.text} onChange={(e) => setAction({ ...action, text: e.target.value })} /></Field>
                <Field label="Due" optional><Input type="date" value={action.due} onChange={(e) => setAction({ ...action, due: e.target.value })} /></Field>
                <div className="flex gap-2"><Button type="submit" variant="primary" size="sm">Save</Button><Button type="button" variant="ghost" size="sm" onClick={() => setAction(null)}>Cancel</Button></div>
              </form>
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className={cx("text-sm", app.nextAction ? "text-n-100" : "text-n-500")}>{app.nextAction ?? (active ? "None set" : "None needed: this application has ended.")}</p>
                  {app.nextActionDue && <p className={cx("text-tiny tabular-nums", daysUntil(app.nextActionDue) < 0 ? "text-bad-400" : "text-n-500")}>Due {formatDate(app.nextActionDue)}</p>}
                </div>
                <Button size="sm" onClick={() => setAction({ text: app.nextAction ?? "", due: app.nextActionDue ?? "" })}>Edit</Button>
              </div>
            )}
          </Section>

          <Section title="Checklist" description={`${done} of ${checklist.length} done. Click a circle to move an item along.`} flush>
            {checklist.length === 0 ? <Empty title="No checklist items" /> : (
              <>
                <p className="px-5 pt-3 text-micro font-medium tracking-wide text-n-500 uppercase">Student</p>
                <ul className="divide-y divide-line">{mine.map((c) => <Item key={c.id} c={c} />)}</ul>
                <p className="border-t border-line px-5 pt-3 text-micro font-medium tracking-wide text-n-500 uppercase">You</p>
                <ul className="divide-y divide-line">{ours.map((c) => <Item key={c.id} c={c} />)}</ul>
              </>
            )}
          </Section>

          <Section title="Notes" description="Staff only. Never include portal passwords.">
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!noteText.trim()) return; save({ notes: [{ id: newId("n"), at: DEMO_NOW, by: counselorId, text: noteText.trim() }, ...(app.notes ?? [])] }); setNoteText(""); }}>
              <Input aria-label="Add a note" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note" /><Button type="submit">Add</Button>
            </form>
            <ul className="mt-4 space-y-3">
              {(app.notes ?? []).length === 0 && <li className="text-sm text-n-500">No notes yet.</li>}
              {(app.notes ?? []).map((n) => <li key={n.id} className="text-sm text-n-200"><span className="mr-2 text-tiny tabular-nums text-n-500">{formatDate(n.at)}</span>{n.text}</li>)}
            </ul>
          </Section>

          <Section title="Status history" description="Every change, who made it, and why.">
            <Timeline events={[...app.history].reverse().map((h, i) => ({
              id: `${h.to}-${i}`, at: h.at, title: `${h.from ? STATUS_LABEL[h.from] + " → " : "Created as "}${STATUS_LABEL[h.to]}`,
              detail: h.reason,
            }))} />
          </Section>
        </div>

        <div className="space-y-4">
          <Section title="Route and fee" actions={<Button size="sm" onClick={() => setEditing(true)}>Edit</Button>}>
            <dl className="space-y-4">
              <Metric label="Submitted through" value={<span className="text-base">{ROUTE_LABEL[app.route]}</span>} hint={app.portalName} />
              <Metric label="Portal" value={app.portalUrl ? <a href={app.portalUrl} target="_blank" rel="noreferrer" className="break-all text-base text-link hover:underline">{app.portalUrl}</a> : <span className="text-base text-n-500">Not recorded</span>} />
              <Metric label="Reference" value={<span className="text-base tabular-nums">{app.externalRef ?? "Not issued yet"}</span>} />
              <Metric label="Application fee" value={<span className="text-base tabular-nums">{app.fee ? money(app.fee) : "None recorded"}</span>} hint={app.fee ? (app.fee.paid ? "Paid" : "Not paid yet") : undefined} />
              <Metric label="Deadline" value={<span className={cx("text-base tabular-nums", dl.unknown && "text-warn-400")}>{dl.unknown ? "Not published" : dl.value}</span>} hint={dl.unknown ? "Not treated as open" : undefined} />
            </dl>
          </Section>

          <Section title="Key dates">
            <dl className="space-y-3 text-sm">
              {[["Started", app.startedAt], ["Submitted", app.submittedAt], ["Decision", app.decisionAt]].map(([k, v]) => (
                <div key={k} className="flex justify-between"><dt className="text-n-400">{k}</dt><dd className="tabular-nums text-n-100">{v ? formatDate(v) : <span className="text-n-500">Not yet</span>}</dd></div>
              ))}
            </dl>
            {app.conditions && <Note className="mt-3" title="Offer conditions">{app.conditions}</Note>}
          </Section>

          <Section title="Submission evidence" description="Confirmation of what was submitted, or why none exists."
            actions={<Button size="sm" onClick={() => { setEvidenceOpen(true); setReason(""); }}>Add</Button>}>
            {(app.evidence ?? []).length === 0 ? <p className="text-sm text-n-500">None yet. Required before this can be marked as submitted.</p> : (
              <ul className="space-y-2 text-sm">
                {app.evidence!.map((e) => (
                  <li key={e.id} className="rounded-sm border border-line px-3 py-2">
                    {e.filename ? <span className="flex items-center gap-2 text-n-100"><Icon.File className="size-4 text-n-500" />{e.filename}</span> : <span className="text-n-200">No file: {e.unavailableReason}</span>}
                    <span className="block text-tiny tabular-nums text-n-500">{formatDate(e.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Disclosure title="Requirements when evaluated" description={snap ? `Captured ${formatDate(snap.capturedAt)}` : "Not captured yet"}>
            {snap ? (
              <div className="space-y-2 text-sm">
                <p className="text-tiny text-n-500">These stay as they were, even if the programme record changes later. Intake {snap.intakeName}; deadline {snap.deadline === "Rolling" || snap.deadline === "Not published" ? snap.deadline : formatDate(snap.deadline)}.</p>
                <dl className="divide-y divide-line rounded-md border border-line">
                  {snap.rows.map((r) => <div key={r.label} className="flex justify-between gap-3 px-3 py-2"><dt className="text-n-400">{r.label}</dt><dd className={cx("text-right", r.unknown ? "text-warn-400" : "text-n-100")}>{r.value}</dd></div>)}
                </dl>
                <p className="text-tiny text-n-500">Record was {snap.programVerification.replace(/_/g, " ")}{snap.lastCheckedAt ? `, last checked ${formatDate(snap.lastCheckedAt)}` : ", never checked"}.</p>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-n-400">
                <p>This application has no saved copy of the requirements it was evaluated against.</p>
                <Button size="sm" onClick={() => save({ snapshot: takeSnapshot(program, intake, DEMO_NOW) })}>Capture them now</Button>
              </div>
            )}
          </Disclosure>
        </div>
      </div>

      {changing && <StatusSheet app={app} counselorId={counselorId} studentConfirmed={!!confirmedAt} onClose={() => setChanging(false)} onSave={(next) => { w.saveApplication(next); setChanging(false); }} />}
      {editing && <EditDetails app={app} onClose={() => setEditing(false)} onSave={(patch) => { save(patch); setEditing(false); }} />}

      <Sheet open={evidenceOpen} onClose={() => setEvidenceOpen(false)} title="Add evidence" description="A confirmation page, receipt or similar. Or record why none can be obtained."
        footer={<><Button variant="ghost" onClick={() => setEvidenceOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => { if (!reason.trim()) return; save({ evidence: [...(app.evidence ?? []), { id: newId("ev"), kind: "other", unavailableReason: reason.trim(), at: DEMO_NOW, by: counselorId }] }); setEvidenceOpen(false); }}>Record reason</Button></>}>
        <div className="space-y-4">
          <Field label="Attach a file" hint="This demo does not store files. Attach one when marking the application as submitted; it records the file name.">
            <Input type="file" disabled />
          </Field>
          <Field label="Or: why no evidence is available" required><Textarea data-autofocus rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        </div>
      </Sheet>
    </div>
  );
}

function EditDetails({ app, onClose, onSave }: { app: Application; onClose: () => void; onSave: (p: Partial<Application>) => void }) {
  const [route, setRoute] = useState<ApplicationRouteType>(app.route);
  const [portalName, setPortalName] = useState(app.portalName ?? "");
  const [portalUrl, setPortalUrl] = useState(app.portalUrl ?? "");
  const [ref, setRef] = useState(app.externalRef ?? "");
  const [fee, setFee] = useState(app.fee?.amount.toString() ?? "");
  const [currency, setCurrency] = useState(app.fee?.currency ?? "EUR");
  const [paid, setPaid] = useState(app.fee?.paid ?? false);
  const [error, setError] = useState<string>();

  const save = () => {
    if (portalUrl && !/^https?:\/\/\S+$/.test(portalUrl)) { setError("Portal address must start with https://"); return; }
    if (fee && (Number.isNaN(Number(fee)) || Number(fee) < 0)) { setError("Enter the fee as a number."); return; }
    onSave({ route, portalName: portalName.trim() || undefined, portalUrl: portalUrl.trim() || undefined, externalRef: ref.trim() || undefined, fee: fee ? { amount: Number(fee), currency, paid } : undefined });
  };
  return (
    <Sheet open onClose={onClose} title="Route and fee" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>Save</Button></>}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Submitted through" required><Select value={route} onChange={(e) => setRoute(e.target.value as ApplicationRouteType)}>{Object.entries(ROUTE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
          <Field label="Portal or service name" optional><Input value={portalName} onChange={(e) => setPortalName(e.target.value)} /></Field>
        </div>
        <Field label="Portal address" optional hint="Never record a password for the portal here."><Input type="url" value={portalUrl} onChange={(e) => setPortalUrl(e.target.value)} placeholder="https://" /></Field>
        <Field label="Reference from the portal" optional><Input value={ref} onChange={(e) => setRef(e.target.value)} /></Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Application fee" optional><Input inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} /></Field>
          <Field label="Currency"><Select value={currency} onChange={(e) => setCurrency(e.target.value)}>{["EUR", "GBP", "USD", "AUD", "SEK", "CZK"].map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <div className="flex items-end gap-3 pb-1.5"><Switch label="Fee paid" checked={paid} onChange={setPaid} /><span className="text-sm text-n-300">Paid</span></div>
        </div>
        {error && <Note tone="bad">{error}</Note>}
      </div>
    </Sheet>
  );
}
