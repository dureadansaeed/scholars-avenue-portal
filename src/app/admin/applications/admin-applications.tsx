"use client";

import { useState } from "react";
import type { AdminIdentity } from "@/components/admin/permissions";
import { Button } from "@/components/ui/button";
import { ApplicationStatusChip, SampleTag, Status } from "@/components/ui/chips";
import { Timeline } from "@/components/ui/domain";
import { Input, Select } from "@/components/ui/form";
import { SidePanel } from "@/components/ui/overlays";
import { Empty, Metric, Section } from "@/components/ui/panels";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { GROUP_LABEL, GROUPS, isActive, STATUS_LABEL, statusGroup } from "@/lib/application-rules";
import { formatDate } from "@/lib/clock";
import { cx } from "@/lib/cx";
import { ROUTE_LABEL } from "@/lib/student-labels";
import type { ApplicationRouteType, ApplicationStatus } from "@/types";
import { useOperations, type OpsData } from "../use-operations";

const PAGE = 15;

export function AdminApplications({ admin, data }: { admin: AdminIdentity; data: OpsData }) {
  const { applications, programs, programOf, universityOf, counselorOf } = useOperations(admin.id, data);
  const [f, setF] = useState({ q: "", country: "", university: "", program: "", intake: "", route: "", counselor: "", group: "", status: "" });
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: string) => { setF((x) => ({ ...x, [k]: v, ...(k === "program" ? { intake: "" } : {}) })); setPage(1); };

  const needle = f.q.trim().toLowerCase();
  const rows = applications.filter((a) => {
    const p = programOf(a.programId);
    return (!needle || `${a.student} ${p?.name ?? ""} ${universityOf(p?.universityId)} ${a.externalRef ?? ""}`.toLowerCase().includes(needle))
      && (!f.country || p?.countryCode === f.country) && (!f.university || p?.universityId === f.university) && (!f.program || a.programId === f.program)
      && (!f.intake || a.intakeId === f.intake) && (!f.route || a.route === f.route) && (!f.counselor || a.counselorId === f.counselor)
      && (!f.group || statusGroup(a.status) === f.group) && (!f.status || a.status === f.status);
  }).sort((a, b) => (b.startedAt ?? "").localeCompare(a.startedAt ?? ""));
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const current = Math.min(page, pages);
  const shown = rows.slice((current - 1) * PAGE, current * PAGE);
  const open = applications.find((a) => a.id === openId);
  const openProgram = open && programOf(open.programId);
  const dirty = Object.values(f).some(Boolean);
  const intakes = f.program ? programOf(f.program)?.intakes ?? [] : [];

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border border-line bg-surface p-5 md:grid-cols-4">
        <Metric label="Applications" value={applications.length} hint="All time" />
        <Metric label="In progress" value={applications.filter((a) => isActive(a.status)).length} hint="No final outcome yet" />
        <Metric label="Offers" value={applications.filter((a) => ["offer_received", "conditional_offer_received", "offer_accepted"].includes(a.status)).length} hint="Received or accepted" />
        <Metric label="Without a next action" value={<span className={cx(applications.some((a) => isActive(a.status) && !a.nextAction) && "text-warn-400")}>{applications.filter((a) => isActive(a.status) && !a.nextAction).length}</span>} hint="Active, nothing planned" />
      </dl>

      <div className="flex flex-wrap items-center gap-2" role="search">
        <Input type="search" aria-label="Search applications" placeholder="Student, programme, university or reference" className="max-w-64" value={f.q} onChange={(e) => set("q", e.target.value)} />
        <Select aria-label="Country" className="w-auto" value={f.country} onChange={(e) => set("country", e.target.value)}><option value="">All countries</option>{data.countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</Select>
        <Select aria-label="University" className="w-auto max-w-56" value={f.university} onChange={(e) => set("university", e.target.value)}><option value="">All universities</option>{data.universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
        <Select aria-label="Programme" className="w-auto max-w-56" value={f.program} onChange={(e) => set("program", e.target.value)}><option value="">All programmes</option>{programs.filter((p) => !f.university || p.universityId === f.university).map((p) => <option key={p.id} value={p.id}>{p.name}, {universityOf(p.universityId)}</option>)}</Select>
        {f.program && <Select aria-label="Intake" className="w-auto" value={f.intake} onChange={(e) => set("intake", e.target.value)}><option value="">All intakes</option>{intakes.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</Select>}
        <Select aria-label="Route" className="w-auto" value={f.route} onChange={(e) => set("route", e.target.value)}><option value="">All routes</option>{(Object.keys(ROUTE_LABEL) as ApplicationRouteType[]).map((r) => <option key={r} value={r}>{ROUTE_LABEL[r]}</option>)}</Select>
        <Select aria-label="Counselor" className="w-auto" value={f.counselor} onChange={(e) => set("counselor", e.target.value)}><option value="">All counselors</option>{data.counselors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
        <Select aria-label="Status group" className="w-auto" value={f.group} onChange={(e) => set("group", e.target.value)}><option value="">Any stage</option>{GROUPS.map((g) => <option key={g} value={g}>{GROUP_LABEL[g]}</option>)}</Select>
        <Select aria-label="Exact status" className="w-auto max-w-56" value={f.status} onChange={(e) => set("status", e.target.value)}><option value="">Any status</option>{(Object.keys(STATUS_LABEL) as ApplicationStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</Select>
        {dirty && <Button size="sm" variant="ghost" onClick={() => { setF({ q: "", country: "", university: "", program: "", intake: "", route: "", counselor: "", group: "", status: "" }); setPage(1); }}>Clear</Button>}
      </div>

      <Section flush title={`${rows.length} application${rows.length === 1 ? "" : "s"}`} actions={<SampleTag />}>
        {rows.length === 0 ? <Empty title="No applications match">Try removing a filter.</Empty> : (
          <Table className="max-h-none">
            <colgroup><col className="w-[20%]" /><col className="w-[28%]" /><col className="w-[14%]" /><col className="w-[14%]" /><col className="w-[24%]" /></colgroup>
            <THead><TH>Student</TH><TH>Programme</TH><TH>Route</TH><TH>Counselor</TH><TH>Status</TH></THead>
            <tbody>
              {shown.map((a) => {
                const p = programOf(a.programId);
                return (
                  <TR key={a.id}>
                    <TD><button type="button" className="block max-w-full truncate text-left text-sm font-medium text-n-100 hover:underline" onClick={() => setOpenId(a.id)}>{a.student}</button>
                      <p className="text-n-500 tabular-nums">{a.startedAt ? `Started ${formatDate(a.startedAt)}` : "Not started"}</p></TD>
                    <TD><p className="truncate text-n-200">{p?.name ?? a.programId}</p><p className="truncate text-n-500">{universityOf(p?.universityId)} · {p?.intakes.find((i) => i.id === a.intakeId)?.name}</p></TD>
                    <TD className="text-n-300">{ROUTE_LABEL[a.route]}</TD>
                    <TD className="text-n-300">{counselorOf(a.counselorId)}</TD>
                    <TD><ApplicationStatusChip status={a.status} label={STATUS_LABEL[a.status]} />{isActive(a.status) && !a.nextAction && <p className="mt-1"><Status tone="warn">No next action</Status></p>}</TD>
                  </TR>
                );
              })}
            </tbody>
          </Table>
        )}
        {rows.length > PAGE && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3 text-tiny text-n-400">
            <span className="tabular-nums">{(current - 1) * PAGE + 1} to {Math.min(current * PAGE, rows.length)} of {rows.length}</span>
            <div className="flex gap-2"><Button size="sm" disabled={current === 1} onClick={() => setPage(current - 1)}>Previous</Button><Button size="sm" disabled={current === pages} onClick={() => setPage(current + 1)}>Next</Button></div>
          </div>
        )}
      </Section>

      <SidePanel open={!!open} onClose={() => setOpenId(null)} title={open?.student ?? ""} description={openProgram ? `${openProgram.name}, ${universityOf(openProgram.universityId)}` : undefined}>
        {open && (
          <div className="space-y-5">
            <ApplicationStatusChip status={open.status} label={STATUS_LABEL[open.status]} />
            <dl className="grid grid-cols-2 gap-4">
              <Metric label="Counselor" value={<span className="text-base">{counselorOf(open.counselorId)}</span>} />
              <Metric label="Route" value={<span className="text-base">{ROUTE_LABEL[open.route]}</span>} />
              <Metric label="Reference" value={<span className="text-base tabular-nums">{open.externalRef ?? "Not issued"}</span>} />
              <Metric label="Submitted" value={<span className="text-base tabular-nums">{open.submittedAt ? formatDate(open.submittedAt) : "Not yet"}</span>} />
            </dl>
            <div><p className="text-micro font-medium tracking-wide text-n-500 uppercase">Next action</p><p className={cx("mt-1 text-sm", open.nextAction ? "text-n-100" : "text-warn-400")}>{open.nextAction ?? "None recorded"}</p></div>
            <div><p className="mb-2 text-micro font-medium tracking-wide text-n-500 uppercase">Status history</p>
              <Timeline events={[...open.history].reverse().map((h, i) => ({ id: `${i}`, at: h.at, title: `${h.from ? `${STATUS_LABEL[h.from]} → ` : "Created as "}${STATUS_LABEL[h.to]}`, detail: h.reason }))} /></div>
          </div>
        )}
      </SidePanel>
    </div>
  );
}
