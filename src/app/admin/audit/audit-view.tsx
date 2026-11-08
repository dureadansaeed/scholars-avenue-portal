"use client";

import { useState } from "react";
import { ReadOnlyNote, usePermissions, type AdminIdentity } from "@/components/admin/permissions";
import { Button } from "@/components/ui/button";
import { HueChip } from "@/components/ui/chips";
import { Input, Select } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Empty, Section } from "@/components/ui/panels";
import { useAdminWork } from "@/lib/admin-work";
import { DEMO_NOW, formatDateTime } from "@/lib/clock";
import { downloadText, toCsv } from "@/lib/csv";
import type { getAuditTrail } from "@/lib/data/admin";
import { inWindow } from "@/lib/reports";
import type { AuditEntry } from "@/types";

type Trail = Awaited<ReturnType<typeof getAuditTrail>>;
const PAGE = 25;
const HUE: Record<string, React.ComponentProps<typeof HueChip>["hue"]> = {
  user: "violet", case: "teal", program: "blue", country: "cyan", city: "cyan", university: "cyan", import: "amber", settings: "orange", export: "pink", student_profile: "green",
};
const show = (v: unknown) => {
  if (v == null) return "none";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > 140 ? `${s.slice(0, 140)}…` : s;
};

export function AuditView({ admin, trail }: { admin: AdminIdentity; trail: Trail }) {
  const { work, logExport } = useAdminWork(admin.id);
  const perm = usePermissions(admin);
  const canView = perm.can("audit.view");
  const canExport = perm.can("reports.export");
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [actor, setActor] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  if (!canView) return <Section><ReadOnlyNote perm="audit.view" /><p className="mt-3 text-sm text-n-400">The audit log is only shown to administrators with that permission.</p></Section>;

  const name = (id: string) => (id === admin.id ? "You" : trail.names[id] ?? id);
  const all: (AuditEntry & { local?: boolean })[] = [...work.audit.map((e) => ({ ...e, local: true })), ...trail.entries].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const needle = q.trim().toLowerCase();
  const rows = all.filter((e) => (!type || e.recordType === type) && (!actor || e.actorId === actor) && inWindow(e.at, from, to)
    && (!needle || `${e.action} ${e.recordId} ${e.reason ?? ""} ${name(e.actorId)} ${JSON.stringify(e.after ?? {})}`.toLowerCase().includes(needle)));
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const current = Math.min(page, pages);
  const shown = rows.slice((current - 1) * PAGE, current * PAGE);
  const types = [...new Set(all.map((e) => e.recordType))].sort();
  const actors = [...new Set(all.map((e) => e.actorId))];
  const reset = (fn: () => void) => { fn(); setPage(1); };

  const exportCsv = () => {
    downloadText(`audit-${DEMO_NOW.slice(0, 10)}.csv`, toCsv([["When", "Who", "Action", "Record type", "Record", "Before", "After", "Reason"],
      ...rows.map((e) => [e.at, name(e.actorId), e.action, e.recordType, e.recordId, JSON.stringify(e.before ?? {}), JSON.stringify(e.after ?? {}), e.reason ?? ""])]));
    logExport("audit", rows.length);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2" role="search">
        <Input type="search" aria-label="Search the audit log" placeholder="Action, record, reason or person" className="max-w-64" value={q} onChange={(e) => reset(() => setQ(e.target.value))} />
        <Select aria-label="Record type" className="w-auto" value={type} onChange={(e) => reset(() => setType(e.target.value))}><option value="">All records</option>{types.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}</Select>
        <Select aria-label="Who" className="w-auto" value={actor} onChange={(e) => reset(() => setActor(e.target.value))}><option value="">Everyone</option>{actors.map((a) => <option key={a} value={a}>{name(a)}</option>)}</Select>
        <label className="flex items-center gap-1.5 text-tiny text-n-400">From<Input type="date" aria-label="From" className="w-36" value={from} onChange={(e) => reset(() => setFrom(e.target.value))} /></label>
        <label className="flex items-center gap-1.5 text-tiny text-n-400">to<Input type="date" aria-label="To" className="w-36" value={to} onChange={(e) => reset(() => setTo(e.target.value))} /></label>
        <Button size="sm" className="ml-auto" disabled={!canExport || rows.length === 0} title={canExport ? undefined : perm.why("reports.export")} onClick={exportCsv}><Icon.Download className="size-3.5" />Export {rows.length}</Button>
      </div>

      <Section flush title={`${rows.length} entr${rows.length === 1 ? "y" : "ies"}`} description="Newest first. Changes made in this browser are included and marked.">
        {rows.length === 0 ? <Empty title="No entries match" /> : (
          <ul className="divide-y divide-line">
            {shown.map((e) => {
              const keys = [...new Set([...Object.keys(e.before ?? {}), ...Object.keys(e.after ?? {})])];
              return (
                <li key={e.id} className="px-5 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <HueChip hue={HUE[e.recordType] ?? "blue"}>{e.recordType.replace(/_/g, " ")}</HueChip>
                    <span className="text-sm font-medium text-n-100">{e.action.replace(/[._]/g, " ")}</span>
                    <span className="text-tiny text-n-500">on {e.recordId}</span>
                  </div>
                  <p className="mt-0.5 text-tiny text-n-500"><span className="text-n-300">{name(e.actorId)}</span> · <time dateTime={e.at} className="tabular-nums">{formatDateTime(e.at)}</time>{e.local && " · this browser"}</p>
                  {e.reason && <p className="mt-1 text-tiny text-n-300">“{e.reason}”</p>}
                  {keys.length > 0 && (
                    <details className="mt-1.5">
                      <summary className="cursor-pointer text-tiny text-n-500 hover:text-n-100">{keys.length} field{keys.length > 1 ? "s" : ""}</summary>
                      <table className="mt-2 w-full table-fixed text-left text-tiny">
                        <caption className="sr-only">Before and after</caption>
                        <thead><tr className="text-micro tracking-wide text-n-500 uppercase"><th className="w-1/4 py-1 font-medium">Field</th><th className="py-1 font-medium">Before</th><th className="py-1 font-medium">After</th></tr></thead>
                        <tbody>{keys.map((k) => (
                          <tr key={k} className="border-t border-line align-top">
                            <td className="py-1.5 pr-2 font-medium text-n-200">{k}</td>
                            <td className="break-words py-1.5 pr-2 text-n-400">{e.before ? show(e.before[k]) : "none"}</td>
                            <td className="break-words py-1.5 text-n-100">{show(e.after?.[k])}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {rows.length > PAGE && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3 text-tiny text-n-400">
            <span className="tabular-nums">{(current - 1) * PAGE + 1} to {Math.min(current * PAGE, rows.length)} of {rows.length}</span>
            <div className="flex gap-2"><Button size="sm" disabled={current === 1} onClick={() => setPage(current - 1)}>Previous</Button><Button size="sm" disabled={current === pages} onClick={() => setPage(current + 1)}>Next</Button></div>
          </div>
        )}
      </Section>
      <p className="text-tiny text-n-500">Counselor review decisions made in their own portal are recorded in their activity panels; in this demo they are not yet merged into this log.</p>
    </div>
  );
}
