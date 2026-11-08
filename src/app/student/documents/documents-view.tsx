"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DocumentStatusChip, Status, Tag } from "@/components/ui/chips";
import { Field, Input, Select } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { SidePanel, Sheet } from "@/components/ui/overlays";
import { Empty, Note, Section } from "@/components/ui/panels";
import { DEMO_NOW, daysUntil, formatDate, formatDateTime, relativeDays } from "@/lib/clock";
import { cx } from "@/lib/cx";
import { DOCUMENT_CATEGORY_LABEL } from "@/mocks/workflow";
import type { DocumentCategory, StudentDocument } from "@/types";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED: Record<string, string> = { "application/pdf": "PDF", "image/jpeg": "JPG", "image/png": "PNG" };

const formatBytes = (n: number) => (n >= 1_048_576 ? `${(n / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

const NEEDS_ACTION = new Set(["requested", "rejected", "replacement_required", "expired"]);
const IN_REVIEW = new Set(["uploaded", "under_review"]);

function validateFile(file: File): string | null {
  if (!ALLOWED[file.type]) return `${file.name} is not a supported type. Upload a PDF, JPG or PNG.`;
  if (file.size > MAX_BYTES) return `${file.name} is ${formatBytes(file.size)}. The limit is 10 MB; try compressing the scan.`;
  if (file.size === 0) return `${file.name} is empty.`;
  return null;
}

export function DocumentsView({ studentId, initial, reviewerNames }: {
  studentId: string; initial: StudentDocument[]; reviewerNames: Record<string, string>;
}) {
  const storageKey = `sa:docs:${studentId}`;
  const [docs, setDocs] = useState(initial);
  const [target, setTarget] = useState<{ docId: string | null } | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const ready = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring uploads after hydration
      if (raw) setDocs(JSON.parse(raw) as StudentDocument[]);
    } catch { /* ignore a corrupt draft */ }
    ready.current = true;
  }, [storageKey]);
  useEffect(() => { if (ready.current) localStorage.setItem(storageKey, JSON.stringify(docs)); }, [docs, storageKey]);

  const groups: { key: string; title: string; description: string; items: StudentDocument[] }[] = [
    { key: "action", title: "Needs your action", description: "Upload or replace these first.", items: docs.filter((d) => NEEDS_ACTION.has(d.status)) },
    { key: "review", title: "With your counselor", description: "Received. Nothing more to do unless we ask.", items: docs.filter((d) => IN_REVIEW.has(d.status)) },
    { key: "done", title: "Verified", description: "Checked and accepted.", items: docs.filter((d) => d.status === "verified") },
    { key: "other", title: "Not needed yet", description: "Optional or not applicable to you right now.", items: docs.filter((d) => d.status === "not_requested" || d.status === "not_applicable") },
  ];

  const required = docs.filter((d) => d.required);
  const handedIn = required.filter((d) => ["uploaded", "under_review", "verified"].includes(d.status)).length;

  const commit = (docId: string | null, file: File, meta?: { category: DocumentCategory; title: string }) => {
    const version = (v: number) => ({ version: v, filename: file.name, mime: file.type, sizeBytes: file.size, uploadedAt: DEMO_NOW, uploadedBy: studentId });
    setDocs((cur) => {
      if (docId) {
        return cur.map((d) => d.id === docId
          ? { ...d, status: "uploaded" as const, reason: undefined, reviewedBy: undefined, reviewedAt: undefined, versions: [version(d.versions.length + 1), ...d.versions] }
          : d);
      }
      const m = meta ?? { category: "other" as const, title: file.name };
      return [...cur, { id: `doc-${crypto.randomUUID().slice(0, 8)}`, studentId, category: m.category, title: m.title, status: "uploaded", required: false, versions: [version(1)] }];
    });
    setNotice(`${file.name} was uploaded. Your counselor will be notified.`);
  };

  const active = docs.find((d) => d.id === historyId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-5 py-4">
        <div>
          <p className="text-sm font-medium text-n-100"><span className="tabular-nums">{handedIn} of {required.length}</span> required documents handed in</p>
          <div className="mt-2 h-1 w-64 max-w-full rounded-full bg-n-800" aria-hidden>
            <div className="h-full rounded-full bg-blue-500 transition-[width] duration-500" style={{ width: `${required.length ? (handedIn / required.length) * 100 : 0}%` }} />
          </div>
        </div>
        <Button variant="primary" onClick={() => setTarget({ docId: null })}><Icon.Upload className="size-4" />Upload a document</Button>
      </div>

      {notice && <Note tone="ok" action={<button type="button" onClick={() => setNotice(null)} className="text-tiny opacity-60 hover:opacity-100">Dismiss</button>}>{notice}</Note>}

      {docs.length === 0 && <Section><Empty title="No documents yet">Your counselor will request documents here. You can also upload one yourself.</Empty></Section>}

      {groups.filter((g) => g.items.length).map((g) => (
        <Section key={g.key} title={g.title} description={g.description} flush>
          <ul className="divide-y divide-line">
            {g.items.map((d) => {
              const overdue = d.dueDate && d.status === "requested" && daysUntil(d.dueDate) < 0;
              const expiring = d.expiresOn && d.status === "verified" && daysUntil(d.expiresOn) <= 180;
              const latest = d.versions[0];
              return (
                <li key={d.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-n-100">{d.title}</p>
                        <DocumentStatusChip status={d.status} />
                        {!d.required && <Tag>Optional</Tag>}
                        {expiring && <Status tone="warn">Expires {formatDate(d.expiresOn!)}</Status>}
                      </div>
                      <p className="mt-0.5 text-tiny text-n-500">{DOCUMENT_CATEGORY_LABEL[d.category]}</p>

                      {d.dueDate && d.status === "requested" && (
                        <p className={cx("mt-1.5 text-tiny tabular-nums", overdue ? "text-bad-400" : "text-n-400")}>
                          Due {formatDate(d.dueDate)} · {relativeDays(d.dueDate)}
                        </p>
                      )}
                      {d.requestNote && d.status === "requested" && <p className="mt-1 text-tiny leading-relaxed text-n-400">{d.requestNote}</p>}
                      {d.reason && (d.status === "rejected" || d.status === "replacement_required" || d.status === "expired") && (
                        <p className="mt-2 rounded-sm border border-bad-400/25 bg-bad-tint px-3 py-2 text-tiny leading-relaxed text-n-200">
                          <span className="font-medium">{d.reviewedBy ? `${reviewerNames[d.reviewedBy] ?? "Your counselor"}: ` : ""}</span>{d.reason}
                        </p>
                      )}
                      {latest && (
                        <p className="mt-1.5 text-tiny tabular-nums text-n-500">
                          {latest.filename} · {formatBytes(latest.sizeBytes)} · uploaded {formatDateTime(latest.uploadedAt)}
                          {d.versions.length > 1 && ` · version ${latest.version}`}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {d.versions.length > 0 && <Button size="sm" variant="ghost" onClick={() => setHistoryId(d.id)}>{d.versions.length > 1 ? `Versions (${d.versions.length})` : "Details"}</Button>}
                      {d.status !== "not_applicable" && d.status !== "verified" && d.status !== "under_review" && (
                        <Button size="sm" variant={NEEDS_ACTION.has(d.status) ? "primary" : "secondary"} onClick={() => setTarget({ docId: d.id })}>
                          <Icon.Upload className="size-3.5" />{d.versions.length ? "Replace" : "Upload"}
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Section>
      ))}

      <UploadSheet key={target ? (target.docId ?? "new") : "closed"} target={target} docs={docs} onClose={() => setTarget(null)} onUploaded={commit} />

      <SidePanel open={!!active} onClose={() => setHistoryId(null)} title={active?.title ?? ""} description={active ? DOCUMENT_CATEGORY_LABEL[active.category] : undefined}>
        {active && (
          <div className="space-y-4">
            <ul className="space-y-3">
              {active.versions.map((v, i) => (
                <li key={v.version} className="rounded-md border border-line p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-n-100">Version {v.version}{i === 0 && <span className="ml-2 text-tiny font-normal text-n-500">Current</span>}</p>
                    <Button size="sm" variant="ghost" onClick={() => setNotice("Demo build: files are not stored, so there is nothing to download yet.")}><Icon.Download className="size-3.5" />Download</Button>
                  </div>
                  <p className="mt-1 break-all text-tiny text-n-400">{v.filename}</p>
                  <p className="text-tiny tabular-nums text-n-500">{formatBytes(v.sizeBytes)} · {formatDateTime(v.uploadedAt)} · by {v.uploadedBy === studentId ? "you" : (reviewerNames[v.uploadedBy] ?? "staff")}</p>
                </li>
              ))}
            </ul>
            <Note>Earlier versions are kept so we can always show exactly which file was used for an application.</Note>
          </div>
        )}
      </SidePanel>
    </div>
  );
}

function UploadSheet({ target, docs, onClose, onUploaded }: {
  target: { docId: string | null } | null; docs: StudentDocument[]; onClose: () => void;
  onUploaded: (docId: string | null, file: File, meta?: { category: DocumentCategory; title: string }) => void;
}) {
  const doc = docs.find((d) => d.id === target?.docId);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [category, setCategory] = useState<DocumentCategory>("other");
  const [title, setTitle] = useState("");
  const [over, setOver] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const pick = (f: File | undefined) => {
    if (!f) return;
    const problem = validateFile(f);
    setError(problem); setFile(problem ? null : f);
  };

  const submit = () => {
    if (!file) { setError("Choose a file first."); return; }
    if (!doc && !title.trim()) { setError("Give this document a name so your counselor can find it."); return; }
    setProgress(0);
    // Mocked transfer so the busy state is real; swap for the actual upload later.
    // The parent is updated from the timer callback, never from inside a state updater.
    let done = 0;
    timer.current = setInterval(() => {
      done = Math.min(100, done + 25);
      setProgress(done);
      if (done === 100) {
        if (timer.current) clearInterval(timer.current);
        onUploaded(doc?.id ?? null, file, doc ? undefined : { category, title: title.trim() });
        setTimeout(onClose, 150);
      }
    }, 160);
  };

  return (
    <Sheet open={!!target} onClose={() => progress == null && onClose()} title={doc ? (doc.versions.length ? `Replace ${doc.title}` : `Upload ${doc.title}`) : "Upload a document"}
      description={doc?.requestNote ?? "PDF, JPG or PNG, up to 10 MB. Scan every page in full."}
      footer={<><Button variant="ghost" disabled={progress != null} onClick={onClose}>Cancel</Button><Button variant="primary" busy={progress != null} onClick={submit}>Upload</Button></>}>
      <div className="space-y-4">
        {doc && doc.versions.length > 0 && <Note tone="info">Your current file stays in the version history. The new one replaces it for review.</Note>}
        {!doc && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Document type" required>
              <Select value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)}>
                {Object.entries(DOCUMENT_CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </Field>
            <Field label="Name" required><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Internship certificate, Acme Ltd" /></Field>
          </div>
        )}
        <label
          onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files[0]); }}
          className={cx("flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed px-6 py-10 text-center transition-colors",
            over ? "border-blue-500 bg-info-tint" : "border-line-strong bg-raised hover:bg-n-850")}>
          <Icon.Upload className="size-5 text-n-500" />
          <span className="text-sm text-n-200">{file ? file.name : "Drop a file here, or choose one"}</span>
          <span className="text-tiny text-n-500">{file ? formatBytes(file.size) : "PDF, JPG or PNG · max 10 MB"}</span>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" disabled={progress != null} onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        {progress != null && (
          <div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress" className="h-1 rounded-full bg-n-800">
            <div className="h-full rounded-full bg-blue-500 transition-[width] duration-150" style={{ width: `${progress}%` }} />
          </div>
        )}
        {error && <Note tone="bad">{error}</Note>}
      </div>
    </Sheet>
  );
}
