"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ReadOnlyNote, usePermissions, type AdminIdentity } from "@/components/admin/permissions";
import { Button } from "@/components/ui/button";
import { CaseStatusChip, Status, Tag } from "@/components/ui/chips";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Segmented } from "@/components/ui/navigation";
import { Sheet, SidePanel } from "@/components/ui/overlays";
import { Empty, Metric, Note, Section } from "@/components/ui/panels";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDate } from "@/lib/clock";
import { cx } from "@/lib/cx";
import { countryName } from "@/mocks/countries";
import type { CaseStatus } from "@/types";
import { CLOSED, useCases, type CaseRow, type CasesData } from "./use-cases";

const PAGE = 12;
type View = "active" | "unassigned" | "closed" | "all";

/** Case actions (CASE-003). Each needs a reason, which goes into the audit history. */
const ACTIONS: { key: string; label: string; to: CaseStatus; when: (s: CaseStatus) => boolean; tone?: "danger" }[] = [
  { key: "activate", label: "Activate", to: "active", when: (s) => s === "invited" || s === "registration_pending" },
  { key: "pause", label: "Pause", to: "on_hold", when: (s) => !CLOSED.includes(s) && s !== "on_hold" && s !== "invited" },
  { key: "resume", label: "Resume", to: "active", when: (s) => s === "on_hold" },
  { key: "close", label: "Close case", to: "closed", when: (s) => !CLOSED.includes(s), tone: "danger" },
  { key: "reopen", label: "Reopen", to: "active", when: (s) => CLOSED.includes(s) },
];

export function CasesView({ admin, data }: { admin: AdminIdentity; data: CasesData }) {
  const params = useSearchParams();
  const router = useRouter();
  const { w, cases, counselors, history } = useCases(admin.id, data);
  const perm = usePermissions(admin);
  const canAssign = perm.can("assignments.manage");

  const [view, setView] = useState<View>((params.get("view") as View) || "active");
  const [q, setQ] = useState("");
  const [counselor, setCounselor] = useState("");
  const [country, setCountry] = useState("");
  const [pkg, setPkg] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(params.get("case"));
  const [assigning, setAssigning] = useState<CaseRow | null>(null);
  const [acting, setActing] = useState<{ row: CaseRow; action: (typeof ACTIONS)[number] } | null>(null);
  const [paying, setPaying] = useState<CaseRow | null>(null);

  const nameOf = (id: string | null) => (id ? data.names[id] ?? counselors.find((c) => c.id === id)?.name ?? id : null);
  const needle = q.trim().toLowerCase();
  const inView = (c: CaseRow) => view === "all" ? true : view === "closed" ? CLOSED.includes(c.status)
    : view === "unassigned" ? !c.counselorId && !CLOSED.includes(c.status) : !CLOSED.includes(c.status);
  const filtered = cases.filter((c) => inView(c)
    && (!needle || `${c.studentName} ${c.email}`.toLowerCase().includes(needle))
    && (!counselor || (counselor === "none" ? !c.counselorId : c.counselorId === counselor))
    && (!country || c.countries.includes(country)) && (!pkg || c.packageId === pkg) && (!status || c.status === status)
    && (!from || c.createdAt >= from) && (!to || c.createdAt <= to))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * PAGE, current * PAGE);
  const reset = (fn: () => void) => { fn(); setPage(1); };
  const counts: Record<View, number> = {
    active: cases.filter((c) => !CLOSED.includes(c.status)).length,
    unassigned: cases.filter((c) => !c.counselorId && !CLOSED.includes(c.status)).length,
    closed: cases.filter((c) => CLOSED.includes(c.status)).length, all: cases.length,
  };
  const open = cases.find((c) => c.id === openId) ?? null;
  const close = () => { setOpenId(null); if (params.get("case")) router.replace("/admin/students" + (view !== "active" ? `?view=${view}` : ""), { scroll: false }); };
  const allCountries = [...new Set(cases.flatMap((c) => c.countries))].sort();
  const packages = [...new Map(cases.map((c) => [c.packageId, c.packageName])).entries()];
  const dirty = q || counselor || country || pkg || status || from || to;

  return (
    <div className="space-y-4">
      {!canAssign && <ReadOnlyNote perm="assignments.manage" />}
      <Segmented label="Cases" size="sm" value={view} onChange={(v) => reset(() => setView(v))}
        options={[{ value: "active", label: "Active", count: counts.active }, { value: "unassigned", label: "Unassigned", count: counts.unassigned },
          { value: "closed", label: "Closed", count: counts.closed }, { value: "all", label: "All", count: counts.all }]} />
      <div className="flex flex-wrap items-end gap-2" role="search">
        <Input type="search" aria-label="Search students" placeholder="Search name or email" className="max-w-56" value={q} onChange={(e) => reset(() => setQ(e.target.value))} />
        <Select aria-label="Counselor" className="w-auto" value={counselor} onChange={(e) => reset(() => setCounselor(e.target.value))}>
          <option value="">All counselors</option><option value="none">Unassigned</option>{counselors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select aria-label="Country" className="w-auto" value={country} onChange={(e) => reset(() => setCountry(e.target.value))}>
          <option value="">All countries</option>{allCountries.map((c) => <option key={c} value={c}>{countryName(c)}</option>)}
        </Select>
        <Select aria-label="Package" className="w-auto" value={pkg} onChange={(e) => reset(() => setPkg(e.target.value))}>
          <option value="">All packages</option>{packages.map(([id, n]) => <option key={id} value={id}>{n}</option>)}
        </Select>
        <Select aria-label="Case status" className="w-auto" value={status} onChange={(e) => reset(() => setStatus(e.target.value))}>
          <option value="">Any status</option>{[...new Set(cases.map((c) => c.status))].map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </Select>
        <label className="flex items-center gap-1.5 text-tiny text-n-400">Opened from<Input type="date" aria-label="Opened from" className="w-36" value={from} onChange={(e) => reset(() => setFrom(e.target.value))} /></label>
        <label className="flex items-center gap-1.5 text-tiny text-n-400">to<Input type="date" aria-label="Opened to" className="w-36" value={to} onChange={(e) => reset(() => setTo(e.target.value))} /></label>
        {dirty && <Button size="sm" variant="ghost" onClick={() => reset(() => { setQ(""); setCounselor(""); setCountry(""); setPkg(""); setStatus(""); setFrom(""); setTo(""); })}>Clear</Button>}
      </div>

      <Section flush>
        {filtered.length === 0 ? <Empty title={view === "unassigned" && !dirty ? "Every active case has a counselor" : "No cases match"}>{dirty ? "Try removing a filter." : undefined}</Empty> : (
          <Table className="max-h-none">
            <colgroup><col className="w-[26%]" /><col className="w-[18%]" /><col className="w-[17%]" /><col className="w-[15%]" /><col className="w-[12%]" /><col className="w-[12%]" /></colgroup>
            <THead><TH>Student</TH><TH>Counselor</TH><TH>Case</TH><TH>Package</TH><TH>Opened</TH><TH>Payment</TH></THead>
            <tbody>
              {shown.map((c) => (
                <TR key={c.id} className={cx(openId === c.id && "bg-n-850/70")}>
                  <TD>
                    <button type="button" onClick={() => setOpenId(c.id)} className="block max-w-full truncate text-left text-sm font-medium text-n-100 hover:underline">{c.studentName}</button>
                    <p className="truncate text-n-500">{c.countries.length ? c.countries.map(countryName).join(", ") : "No countries yet"}</p>
                  </TD>
                  <TD>{c.counselorId ? <span className="text-n-200">{nameOf(c.counselorId)}</span> : <Status tone="warn">Unassigned</Status>}</TD>
                  <TD><CaseStatusChip status={c.status} /></TD>
                  <TD className="text-n-300">{c.packageName}<p className="text-n-500 tabular-nums">{c.applications}{c.maxApplications != null ? ` of ${c.maxApplications}` : ""} applications</p></TD>
                  <TD className="tabular-nums text-n-300">{formatDate(c.createdAt)}</TD>
                  <TD>{c.paymentConfirmed ? <Status tone="ok">Confirmed</Status> : <Status tone="neutral">Not confirmed</Status>}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
        {filtered.length > PAGE && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3 text-tiny text-n-400">
            <span className="tabular-nums">{(current - 1) * PAGE + 1} to {Math.min(current * PAGE, filtered.length)} of {filtered.length}</span>
            <div className="flex gap-2"><Button size="sm" disabled={current === 1} onClick={() => setPage(current - 1)}>Previous</Button><Button size="sm" disabled={current === pages} onClick={() => setPage(current + 1)}>Next</Button></div>
          </div>
        )}
      </Section>

      <SidePanel open={!!open} onClose={close} title={open?.studentName ?? ""} description={open ? `${open.packageName} package · opened ${formatDate(open.createdAt)}` : undefined}>
        {open && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2"><CaseStatusChip status={open.status} />{open.paymentConfirmed ? <Status tone="ok">Payment confirmed</Status> : <Status tone="neutral">Payment not confirmed</Status>}</div>
            <dl className="grid grid-cols-2 gap-4">
              <Metric label="Counselor" value={<span className="text-base">{nameOf(open.counselorId) ?? "Unassigned"}</span>} />
              <Metric label="Applications" value={<span className="text-base tabular-nums">{open.applications}{open.maxApplications != null ? ` of ${open.maxApplications}` : ""}</span>} hint="Used of package scope" />
              <Metric label="Activated" value={<span className="text-base tabular-nums">{open.activatedAt ? formatDate(open.activatedAt) : "Not yet"}</span>} />
              <Metric label="Countries" value={<span className="text-base">{open.countries.length ? open.countries.map(countryName).join(", ") : "None"}</span>} />
            </dl>

            <div className="space-y-2">
              <p className="text-micro font-medium tracking-wide text-n-500 uppercase">Actions</p>
              {!canAssign && <ReadOnlyNote perm="assignments.manage" />}
              <div className="flex flex-wrap gap-2">
                <Button variant={open.counselorId ? "secondary" : "primary"} disabled={!canAssign || CLOSED.includes(open.status)} onClick={() => setAssigning(open)}>
                  {open.counselorId ? "Reassign" : "Assign counselor"}
                </Button>
                {!open.paymentConfirmed && <Button disabled={!canAssign} onClick={() => setPaying(open)}>Mark paid and activate</Button>}
                {ACTIONS.filter((a) => a.when(open.status)).map((a) => (
                  <Button key={a.key} variant={a.tone === "danger" ? "ghost" : "secondary"} disabled={!canAssign} onClick={() => setActing({ row: open, action: a })}>{a.label}</Button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-micro font-medium tracking-wide text-n-500 uppercase">Assignment history</p>
              {history(open.id).length === 0 ? <p className="text-sm text-n-500">Never assigned.</p> : (
                <ol className="space-y-2.5">
                  {history(open.id).map((a) => (
                    <li key={a.id} className="rounded-sm border border-line px-3 py-2 text-sm">
                      <p className="text-n-100">{a.previousCounselorId ? `${nameOf(a.previousCounselorId)} → ${nameOf(a.counselorId)}` : `Assigned to ${nameOf(a.counselorId)}`}</p>
                      <p className="text-tiny text-n-500 tabular-nums">{formatDate(a.assignedAt)} · by {a.assignedBy === admin.id ? "you" : nameOf(a.assignedBy)}</p>
                      {a.reason && <p className="text-tiny text-n-400">“{a.reason}”</p>}
                    </li>
                  ))}
                </ol>
              )}
              <p className="mt-2 text-tiny text-n-500">Earlier assignments are never overwritten.</p>
            </div>
            <Link href={`/admin/users/${open.studentId}`} className="text-tiny font-medium text-link hover:underline">Open the student&apos;s account</Link>
          </div>
        )}
      </SidePanel>

      {assigning && <AssignSheet row={assigning} counselors={counselors} nameOf={nameOf} onClose={() => setAssigning(null)}
        onAssign={(cid, reason) => { w.assign(assigning, cid, reason); setAssigning(null); }} />}

      {acting && <ReasonSheet title={`${acting.action.label}: ${acting.row.studentName}`} confirm={acting.action.label} danger={acting.action.tone === "danger"}
        note={acting.action.to === "closed" ? "Closing keeps every record. The case can be reopened later." : undefined}
        onClose={() => setActing(null)} onConfirm={(reason) => { w.setCaseStatus(acting.row, acting.action.to, reason); setActing(null); }} />}

      {paying && <PaySheet row={paying} onClose={() => setPaying(null)} onConfirm={(ref) => { w.activatePackage(paying, ref); setPaying(null); }} />}
    </div>
  );
}

function AssignSheet({ row, counselors, nameOf, onClose, onAssign }: {
  row: CaseRow; counselors: ReturnType<typeof useCases>["counselors"]; nameOf: (id: string | null) => string | null;
  onClose: () => void; onAssign: (counselorId: string, reason?: string) => void;
}) {
  const options = counselors.filter((c) => c.active && c.id !== row.counselorId);
  const [cid, setCid] = useState("");
  const [reason, setReason] = useState("");
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string>();
  const pick = options.find((c) => c.id === cid);
  const overloaded = pick ? pick.activeCases + 1 > pick.threshold : false;
  const reassign = !!row.counselorId;

  const submit = () => {
    if (!pick) { setError("Choose a counselor."); return; }
    if (reassign && reason.trim().length < 5) { setError("A reason is required for a reassignment. It stays in the history."); return; }
    if (overloaded && !over) { setError("This counselor would be over their workload limit. Confirm to assign anyway."); return; }
    onAssign(pick.id, reason.trim() || undefined);
  };

  return (
    <Sheet open onClose={onClose} title={reassign ? `Reassign ${row.studentName}` : `Assign ${row.studentName}`}
      description={reassign ? `Currently with ${nameOf(row.counselorId)}. The previous assignment stays in the history.` : "The student and the counselor are both notified."}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={submit}>{reassign ? "Reassign" : "Assign"}</Button></>}>
      <div className="space-y-4">
        <fieldset>
          <legend className="mb-2 text-micro font-medium tracking-wide text-n-400 uppercase">Counselor <span className="normal-case tracking-normal text-n-500">Required</span></legend>
          <div className="space-y-1.5">
            {options.map((c) => {
              const after = c.activeCases + 1;
              const match = row.countries.filter((x) => c.expertise.includes(x)).length;
              return (
                <label key={c.id} className={cx("press flex cursor-pointer items-center gap-3 rounded-sm border px-3 py-2.5", cid === c.id ? "border-blue-500 bg-info-tint" : "border-line hover:bg-n-850")}>
                  <input type="radio" name="counselor" className="accent-blue-500" checked={cid === c.id} onChange={() => { setCid(c.id); setOver(false); setError(undefined); }} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-n-100">{c.name}{c.absent && <span className="font-normal text-warn-400"> · away</span>}</span>
                    <span className="block text-tiny text-n-500">{match ? `Knows ${match} of the student's countries · ` : ""}{c.languages.join(", ")}</span>
                  </span>
                  <span className={cx("text-tiny tabular-nums", after > c.threshold ? "text-bad-400" : "text-n-400")}>{c.activeCases} → {after} of {c.threshold}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
        {pick?.absent && <Note tone="warn">{pick.name} is marked away. New students should normally go to someone available.</Note>}
        {overloaded && <Note tone="warn" title="Over the workload limit"><p>{pick!.name} would have {pick!.activeCases + 1} active cases against a limit of {pick!.threshold}.</p>
          <div className="mt-2"><Checkbox label="Assign anyway" checked={over} onChange={(e) => setOver(e.target.checked)} /></div></Note>}
        <Field label="Reason" required={reassign} optional={!reassign} error={error}><Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      </div>
    </Sheet>
  );
}

export function ReasonSheet({ title, confirm, danger, note, onClose, onConfirm }: {
  title: string; confirm: string; danger?: boolean; note?: string; onClose: () => void; onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  return (
    <Sheet open onClose={onClose} title={title} description="The reason is recorded with your name and the date."
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant={danger ? "danger" : "primary"} onClick={() => {
        if (reason.trim().length < 5) { setError("Record why. It is kept in the audit history."); return; }
        onConfirm(reason.trim());
      }}>{confirm}</Button></>}>
      <div className="space-y-4">
        {note && <Note>{note}</Note>}
        <Field label="Reason" required error={error}><Textarea data-autofocus rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      </div>
    </Sheet>
  );
}

function PaySheet({ row, onClose, onConfirm }: { row: CaseRow; onClose: () => void; onConfirm: (ref: string) => void }) {
  const [ref, setRef] = useState("");
  return (
    <Sheet open onClose={onClose} title={`Mark ${row.studentName}'s package as paid`}
      description="Records an externally confirmed payment and activates the case. No payment is taken here."
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={() => onConfirm(ref.trim())}>Confirm payment</Button></>}>
      <div className="space-y-4">
        <Field label="Payment reference" optional hint="Invoice or transfer reference, if you have one. Never card details."><Input data-autofocus value={ref} onChange={(e) => setRef(e.target.value)} /></Field>
        {(row.status === "invited" || row.status === "registration_pending") && <Note>The case moves to “Profile incomplete” so the student can start their profile.</Note>}
        <p className="text-tiny text-n-500"><Tag>{row.packageName}</Tag></p>
      </div>
    </Sheet>
  );
}
