"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DocumentStatusChip, Status, Tag } from "@/components/ui/chips";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Sheet, SidePanel } from "@/components/ui/overlays";
import { Empty, Note, Section } from "@/components/ui/panels";
import { DEMO_NOW, daysUntil, formatDate, formatDateTime, relativeDays } from "@/lib/clock";
import { cx } from "@/lib/cx";
import { newId } from "@/lib/use-local-state";
import { DOCUMENT_CATEGORY_LABEL } from "@/mocks/workflow";
import type { DocumentCategory, DocumentStatus, StudentDocument } from "@/types";
import { useReviewOverlay } from "../review-state";

const formatBytes = (n: number) => (n >= 1_048_576 ? `${(n / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** Which statuses a document may move to from where it is (DOC-007). */
const NEXT: Record<DocumentStatus, DocumentStatus[]> = {
  not_requested: [], requested: ["not_applicable"], uploaded: ["under_review", "verified", "rejected", "replacement_required"],
  under_review: ["verified", "rejected", "replacement_required"], verified: ["expired", "replacement_required"],
  rejected: ["under_review"], replacement_required: ["not_applicable"], expired: ["replacement_required"], not_applicable: [],
};
const NEEDS_REASON = new Set<DocumentStatus>(["rejected", "replacement_required"]);
const VERB: Partial<Record<DocumentStatus, string>> = {
  under_review: "Start review", verified: "Verify", rejected: "Reject…", replacement_required: "Ask for replacement…",
  expired: "Mark expired", not_applicable: "Not needed",
};

export function DocumentsReview({ counselorId, studentId, documents, reviewerNames }: {
  counselorId: string; studentId: string; documents: StudentDocument[]; reviewerNames: Record<string, string>;
}) {
  const r = useReviewOverlay(studentId, counselorId);
  const [acting, setActing] = useState<{ doc: StudentDocument; to: DocumentStatus } | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string>();
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [req, setReq] = useState({ category: "motivation_letter" as DocumentCategory, title: "", dueDate: "", note: "" });
  const [reqErrors, setReqErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);

  const all = [...documents, ...r.overlay.requests].map((d) => {
    const o = r.overlay.docs[d.id];
    return o ? { ...d, status: o.status, reason: o.reason, reviewedBy: o.reviewedBy, reviewedAt: o.reviewedAt } : d;
  });
  const queue = all.filter((d) => d.status === "uploaded" || d.status === "under_review");
  const rest = all.filter((d) => !queue.includes(d));
  const active = all.find((d) => d.id === historyId);

  const go = (doc: StudentDocument, to: DocumentStatus) => {
    if (NEEDS_REASON.has(to)) { setActing({ doc, to }); setReason(""); setReasonError(undefined); return; }
    r.setDoc(doc.id, doc.title, to);
  };
  const confirm = () => {
    if (!acting) return;
    if (reason.trim().length < 5) { setReasonError("A reason is required so the student knows what to fix."); return; }
    r.setDoc(acting.doc.id, acting.doc.title, acting.to, reason.trim());
    setActing(null);
  };

  const submitRequest = () => {
    const e: Record<string, string> = {};
    if (!req.title.trim()) e.title = "Name the document.";
    if (!req.dueDate) e.dueDate = "Set a due date so it can be tracked.";
    else if (req.dueDate < DEMO_NOW.slice(0, 10)) e.dueDate = "The due date cannot be in the past.";
    setReqErrors(e);
    if (Object.keys(e).length) return;
    r.addRequest({ id: newId("doc"), studentId, category: req.category, title: req.title.trim(), status: "requested", required: true, requestedBy: counselorId, requestNote: req.note.trim() || undefined, dueDate: req.dueDate, versions: [] });
    setRequesting(false); setReq({ category: "motivation_letter", title: "", dueDate: "", note: "" });
    setNotice("Request created. The student gets it as a task with that due date.");
  };

  const Row = ({ d }: { d: StudentDocument }) => {
    const latest = d.versions[0];
    const exp = d.expiresOn ? daysUntil(d.expiresOn) : null;
    return (
      <li className="px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-n-100">{d.title}</p>
              <DocumentStatusChip status={d.status} />
              {!d.required && <Tag>Optional</Tag>}
              {exp != null && exp <= 180 && <Status tone={exp < 0 ? "bad" : "warn"}>{exp < 0 ? "Expired" : "Expires"} {formatDate(d.expiresOn!)}</Status>}
            </div>
            <p className="text-tiny text-n-500">{DOCUMENT_CATEGORY_LABEL[d.category]}</p>
            {d.status === "requested" && d.dueDate && <p className={cx("mt-1 text-tiny tabular-nums", daysUntil(d.dueDate) < 0 ? "text-bad-400" : "text-n-400")}>Due {formatDate(d.dueDate)} · {relativeDays(d.dueDate)}</p>}
            {d.reason && <p className="mt-1.5 rounded-sm border border-bad-400/25 bg-bad-tint px-3 py-2 text-tiny leading-relaxed text-n-200">Reason given: {d.reason}</p>}
            {latest && <p className="mt-1.5 text-tiny tabular-nums text-n-500">{latest.filename} · {formatBytes(latest.sizeBytes)} · uploaded {formatDate(latest.uploadedAt)}{d.versions.length > 1 && ` · version ${latest.version}`}</p>}
            {d.reviewedBy && d.reviewedAt && <p className="text-tiny text-n-500">Reviewed by {reviewerNames[d.reviewedBy] ?? d.reviewedBy}, {formatDate(d.reviewedAt)}</p>}
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            {d.versions.length > 0 && <Button size="sm" variant="ghost" onClick={() => setHistoryId(d.id)}>{d.versions.length > 1 ? `Versions (${d.versions.length})` : "Details"}</Button>}
            {NEXT[d.status].map((to) => (
              <Button key={to} size="sm" variant={to === "verified" ? "primary" : "secondary"} onClick={() => go(d, to)}>{VERB[to]}</Button>
            ))}
          </div>
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-5 py-4">
        <p className="text-sm text-n-200"><span className="tabular-nums font-medium">{queue.length}</span> waiting for your review · <span className="tabular-nums">{all.length}</span> documents in total</p>
        <Button variant="primary" onClick={() => setRequesting(true)}><Icon.Plus className="size-4" />Request a document</Button>
      </div>
      {notice && <Note tone="ok" action={<button type="button" className="text-tiny opacity-60 hover:opacity-100" onClick={() => setNotice(null)}>Dismiss</button>}>{notice}</Note>}

      {queue.length > 0 && <Section title="Review queue" description="Uploaded by the student. Decide on each." flush><ul className="divide-y divide-line">{queue.map((d) => <Row key={d.id} d={d} />)}</ul></Section>}
      <Section title={queue.length ? "Everything else" : "Documents"} flush>
        {rest.length === 0 ? <Empty title="No other documents" /> : <ul className="divide-y divide-line">{rest.map((d) => <Row key={d.id} d={d} />)}</ul>}
      </Section>

      <Sheet open={!!acting} onClose={() => setActing(null)} title={acting?.to === "rejected" ? "Reject document" : "Ask for a replacement"} description={acting?.doc.title}
        footer={<><Button variant="ghost" onClick={() => setActing(null)}>Cancel</Button><Button variant="danger" onClick={confirm}>{acting?.to === "rejected" ? "Reject" : "Request replacement"}</Button></>}>
        <Field label="Reason" required error={reasonError} hint="The student sees this as written, so say exactly what is wrong and how to fix it.">
          <Textarea data-autofocus rows={4} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </Sheet>

      <Sheet open={requesting} onClose={() => setRequesting(false)} title="Request a document" description="The student gets a task with this due date and a notification."
        footer={<><Button variant="ghost" onClick={() => setRequesting(false)}>Cancel</Button><Button variant="primary" onClick={submitRequest}>Send request</Button></>}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Type" required><Select value={req.category} onChange={(e) => setReq({ ...req, category: e.target.value as DocumentCategory })}>
            {Object.entries(DOCUMENT_CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
          <Field label="Name" required error={reqErrors.title}><Input value={req.title} onChange={(e) => setReq({ ...req, title: e.target.value })} placeholder="Motivation letter, Amstelburg" /></Field>
          <Field label="Due date" required error={reqErrors.dueDate}><Input type="date" value={req.dueDate} onChange={(e) => setReq({ ...req, dueDate: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Instructions" optional><Textarea rows={3} value={req.note} onChange={(e) => setReq({ ...req, note: e.target.value })} /></Field></div>
        </div>
      </Sheet>

      <SidePanel open={!!active} onClose={() => setHistoryId(null)} title={active?.title ?? ""} description={active ? DOCUMENT_CATEGORY_LABEL[active.category] : undefined}>
        {active && (
          <div className="space-y-3">
            {active.versions.map((v, i) => (
              <div key={v.version} className="rounded-md border border-line p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-n-100">Version {v.version}{i === 0 && <span className="ml-2 text-tiny font-normal text-n-500">Current</span>}</p>
                  <Button size="sm" variant="ghost" onClick={() => setNotice("Demo build: files are not stored, so there is nothing to preview or download yet.")}><Icon.Eye className="size-3.5" />Preview</Button>
                </div>
                <p className="mt-1 break-all text-tiny text-n-400">{v.filename}</p>
                <p className="text-tiny tabular-nums text-n-500">{formatBytes(v.sizeBytes)} · {formatDateTime(v.uploadedAt)} · by {reviewerNames[v.uploadedBy] ?? "student"}</p>
              </div>
            ))}
            <Note>Earlier versions are kept so you can show exactly which file went into an application.</Note>
          </div>
        )}
      </SidePanel>
    </div>
  );
}
