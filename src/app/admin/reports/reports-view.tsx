"use client";

import { useState } from "react";
import { ReadOnlyNote, usePermissions, type AdminIdentity } from "@/components/admin/permissions";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Metric, Section } from "@/components/ui/panels";
import { GROUP_LABEL, GROUPS, statusGroup } from "@/lib/application-rules";
import { daysUntil, DEMO_NOW, formatDate, isPast } from "@/lib/clock";
import { downloadText, toCsv } from "@/lib/csv";
import { cx } from "@/lib/cx";
import { breakdown, inWindow, outcomes, type BreakdownRow } from "@/lib/reports";
import { REVIEW_INTERVAL_DAYS } from "@/lib/catalog-rules";
import { useOperations, type OpsData } from "../use-operations";

function Bars({ rows, caption }: { rows: BreakdownRow[]; caption: string }) {
  const max = Math.max(1, ...rows.map((r) => r.total));
  if (!rows.length) return <p className="text-sm text-n-500">Nothing in this range.</p>;
  return (
    <table className="w-full text-left text-tiny">
      <caption className="sr-only">{caption}</caption>
      <thead><tr className="border-b border-line text-micro tracking-wide text-n-500 uppercase"><th className="py-2 font-medium">Group</th><th className="w-2/5 py-2 font-medium"><span className="sr-only">Share</span></th><th className="py-2 text-right font-medium">Pending</th><th className="py-2 text-right font-medium">Final</th><th className="py-2 text-right font-medium">Total</th></tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key} className="border-b border-line last:border-0">
            <td className="py-2 pr-3 text-n-200">{r.label}</td>
            <td className="py-2 pr-3"><div className="flex h-1.5 overflow-hidden rounded-full bg-n-800" aria-hidden>
              <div className="h-full bg-blue-500" style={{ width: `${(r.pending / max) * 100}%` }} /><div className="h-full bg-n-400" style={{ width: `${(r.final / max) * 100}%` }} /></div></td>
            <td className="py-2 text-right tabular-nums text-n-300">{r.pending}</td>
            <td className="py-2 text-right tabular-nums text-n-300">{r.final}</td>
            <td className="py-2 text-right font-medium tabular-nums text-n-100">{r.total}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Definition({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 border-t border-line pt-3 text-tiny leading-relaxed text-n-500"><span className="font-medium text-n-400">How this is counted: </span>{children}</p>;
}

export function ReportsView({ admin, data }: { admin: AdminIdentity; data: OpsData }) {
  const { admin: w, applications, programs, programOf, universityOf, counselorOf } = useOperations(admin.id, data);
  const perm = usePermissions(admin);
  const canExport = perm.can("reports.export");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [country, setCountry] = useState("");
  const [counselor, setCounselor] = useState("");

  const apps = applications.filter((a) => inWindow(a.startedAt, from, to) && (!country || programOf(a.programId)?.countryCode === country) && (!counselor || a.counselorId === counselor));
  const range = from || to ? `Applications started ${from ? `from ${formatDate(from)}` : ""}${from && to ? " " : ""}${to ? `to ${formatDate(to)}` : ""}` : "All dates";
  const filters = [range, country && data.countries.find((c) => c.code === country)?.name, counselor && counselorOf(counselor)].filter(Boolean).join(" · ");

  const byGroup = GROUPS.map((g) => ({ key: g, label: GROUP_LABEL[g], total: 0, pending: 0, final: 0 }));
  apps.forEach((a) => { const r = byGroup.find((x) => x.key === statusGroup(a.status))!; r.total++; if (["ended"].includes(statusGroup(a.status)) || a.status === "offer_accepted") r.final++; else r.pending++; });
  const reports = {
    country: breakdown(apps, (a) => programOf(a.programId)?.countryCode ?? "", (k) => data.countries.find((c) => c.code === k)?.name ?? k),
    university: breakdown(apps, (a) => programOf(a.programId)?.universityId ?? "", (k) => universityOf(k)),
    intake: breakdown(apps, (a) => programOf(a.programId)?.intakes.find((i) => i.id === a.intakeId)?.name ?? "", (k) => k),
    counselor: breakdown(apps, (a) => a.counselorId, (k) => counselorOf(k)),
  };
  const out = outcomes(apps.map((a) => a.status));

  const activeCases = data.cases.filter((c) => !["completed", "cancelled", "closed"].includes(c.status) && (!country || c.countries.includes(country)) && (!counselor || c.counselorId === counselor));
  const ids = new Set(activeCases.map((c) => c.studentId));
  const comp = activeCases.map((c) => data.completion[c.studentId] ?? 0);
  const completion = [
    { key: "low", label: "Under 50%", total: comp.filter((x) => x < 50).length },
    { key: "mid", label: "50% to 99%", total: comp.filter((x) => x >= 50 && x < 100).length },
    { key: "full", label: "Complete", total: comp.filter((x) => x === 100).length },
  ];
  const docs = data.documents.filter((d) => ids.has(d.studentId));
  const docRows = (["requested", "uploaded", "under_review", "rejected", "replacement_required", "expired"] as const).map((s) => ({ key: s, label: s.replace(/_/g, " ").replace(/^./, (x) => x.toUpperCase()), total: docs.filter((d) => d.status === s).length }));
  const overdueRequests = docs.filter((d) => d.status === "requested" && d.dueDate && isPast(d.dueDate)).length;

  const coverage = data.countries.map((c) => {
    const ps = programs.filter((p) => p.countryCode === c.code && p.status !== "archived");
    const verified = ps.filter((p) => p.status === "verified");
    const stale = verified.filter((p) => !p.lastCheckedAt || daysUntil(p.lastCheckedAt) < -REVIEW_INTERVAL_DAYS);
    return { code: c.code, name: c.name, programmes: ps.length, verified: verified.length, stale: stale.length };
  });

  const tasks = data.tasks.filter((t) => ids.has(t.studentId) && t.status !== "completed" && t.status !== "cancelled");
  const overdueTasks = tasks.filter((t) => isPast(t.dueDate)).length;
  const deadlines = apps.filter((a) => !["ended", "decision", "submitted", "university"].includes(statusGroup(a.status))).map((a) => programOf(a.programId)?.intakes.find((i) => i.id === a.intakeId)?.deadline).filter((d): d is string => !!d);

  const exportCsv = (name: string, header: string[], rows: (string | number)[][]) => {
    downloadText(`${name}-${DEMO_NOW.slice(0, 10)}.csv`, toCsv([[`Report: ${name}`], [`Filters: ${filters}`], [`Generated: ${formatDate(DEMO_NOW)}`], [], header, ...rows]));
    w.logExport(`report:${name}`, rows.length);
  };
  const exportButton = (name: string, header: string[], rows: (string | number)[][]) => (
    <Button size="sm" variant="ghost" disabled={!canExport} title={canExport ? undefined : perm.why("reports.export")} onClick={() => exportCsv(name, header, rows)}><Icon.Download className="size-3.5" />CSV</Button>
  );
  const bk = (rows: BreakdownRow[]) => rows.map((r) => [r.label, r.pending, r.final, r.total]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-line bg-surface p-4" role="group" aria-label="Report filters">
        <label className="flex items-center gap-1.5 text-tiny text-n-400">Applications started from<Input type="date" aria-label="From" className="w-36" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="flex items-center gap-1.5 text-tiny text-n-400">to<Input type="date" aria-label="To" className="w-36" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <Select aria-label="Country" className="w-auto" value={country} onChange={(e) => setCountry(e.target.value)}><option value="">All countries</option>{data.countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</Select>
        <Select aria-label="Counselor" className="w-auto" value={counselor} onChange={(e) => setCounselor(e.target.value)}><option value="">All counselors</option>{data.counselors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
        {(from || to || country || counselor) && <Button size="sm" variant="ghost" onClick={() => { setFrom(""); setTo(""); setCountry(""); setCounselor(""); }}>Clear</Button>}
        <p className="basis-full text-tiny text-n-500">Showing: {filters}. Applications with no start date are left out once a date range is set.</p>
      </div>
      {!canExport && <ReadOnlyNote perm="reports.export" />}

      <Section title="Applications by stage" description={`${apps.length} application${apps.length === 1 ? "" : "s"}. Pending and final outcomes are counted separately.`}
        actions={exportButton("applications-by-stage", ["Stage", "Pending", "Final", "Total"], bk(byGroup))}>
        <Bars rows={byGroup} caption="Applications by stage" />
        <Definition>Each application is counted once, in the stage of its current status. Final means offer accepted, offer declined, rejected, withdrawn or closed; everything else, including an offer not yet answered, is pending.</Definition>
      </Section>

      <Section title="Outcomes" actions={exportButton("outcomes", ["Measure", "Count"], Object.entries(out).map(([k, v]) => [k, v]))}>
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <Metric label="Offers" value={out.offers} /><Metric label="Accepted" value={out.accepted} /><Metric label="Rejected" value={out.rejected} />
          <Metric label="Withdrawn" value={out.withdrawn} /><Metric label="Still pending" value={out.pending} />
        </dl>
        <Definition>Current status of applications in range. Offers include conditional offers and offers later accepted or declined. These are counts, not success rates: many applications have no outcome yet.</Definition>
      </Section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {([["country", "By country", "Country of the programme."], ["university", "By university", "University of the programme."], ["intake", "By intake", "Intake name on the application."], ["counselor", "By counselor", "Counselor responsible for the application. A workload view, not a performance measure."]] as const).map(([k, title, def]) => (
          <Section key={k} title={title} actions={exportButton(`applications-by-${k}`, [title.replace("By ", ""), "Pending", "Final", "Total"], bk(reports[k]))}>
            <Bars rows={reports[k]} caption={`Applications ${title.toLowerCase()}`} />
            <Definition>{def}</Definition>
          </Section>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Profile completion" description={`${activeCases.length} active cases`} actions={exportButton("profile-completion", ["Band", "Students"], completion.map((c) => [c.label, c.total]))}>
          <ul className="space-y-2">{completion.map((c) => (
            <li key={c.key} className="flex items-center justify-between text-sm"><span className="text-n-200">{c.label}</span><span className="tabular-nums font-medium text-n-100">{c.total}</span></li>
          ))}</ul>
          <Definition>Share of required profile sections and documents done, per student with an active case. The date range does not apply.</Definition>
        </Section>
        <Section title="Documents waiting" actions={exportButton("pending-documents", ["Status", "Documents"], docRows.map((d) => [d.label, d.total]))}>
          <ul className="space-y-2">{docRows.map((d) => (
            <li key={d.key} className="flex items-center justify-between text-sm"><span className="text-n-200">{d.label}</span><span className="tabular-nums font-medium text-n-100">{d.total}</span></li>
          ))}</ul>
          <p className={cx("mt-3 text-tiny", overdueRequests ? "text-bad-400" : "text-n-500")}>{overdueRequests} request{overdueRequests === 1 ? "" : "s"} past their due date.</p>
          <Definition>Documents of students with an active case, by current status. The date range does not apply.</Definition>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Tasks and deadlines">
          <dl className="grid grid-cols-3 gap-4">
            <Metric label="Open tasks" value={tasks.length} /><Metric label="Overdue" value={<span className={cx(overdueTasks > 0 && "text-bad-400")}>{overdueTasks}</span>} />
            <Metric label="Deadlines ≤ 30 days" value={deadlines.filter((d) => !isPast(d) && daysUntil(d) <= 30).length} hint="Not yet submitted" />
          </dl>
          <Definition>Open tasks of students with an active case; overdue is worked out from the due date. Deadlines are for applications in range that are not yet submitted; unpublished deadlines are not counted.</Definition>
        </Section>
        <Section title="Catalog coverage" actions={exportButton("catalog-coverage", ["Country", "Programmes", "Verified", "Stale"], coverage.map((c) => [c.name, c.programmes, c.verified, c.stale]))} flush>
          <table className="w-full text-left text-tiny">
            <caption className="sr-only">Catalog coverage by country</caption>
            <thead><tr className="border-b border-line text-micro tracking-wide text-n-500 uppercase"><th className="px-5 py-2 font-medium">Country</th><th className="py-2 text-right font-medium">Programmes</th><th className="py-2 text-right font-medium">Verified</th><th className="px-5 py-2 text-right font-medium">Stale</th></tr></thead>
            <tbody>{coverage.map((c) => (
              <tr key={c.code} className="border-b border-line last:border-0">
                <td className="px-5 py-2 text-n-200">{c.name}</td><td className="py-2 text-right tabular-nums text-n-300">{c.programmes}</td>
                <td className="py-2 text-right tabular-nums text-n-300">{c.verified}{c.programmes ? <span className="text-n-500"> ({Math.round((c.verified / c.programmes) * 100)}%)</span> : ""}</td>
                <td className={cx("px-5 py-2 text-right tabular-nums", c.stale ? "text-warn-400" : "text-n-300")}>{c.stale}</td>
              </tr>
            ))}</tbody>
          </table>
          <div className="px-5 pb-4"><Definition>Programmes not archived. Stale means verified but last checked more than {REVIEW_INTERVAL_DAYS} days ago. A country with no programmes is still supported; its catalog is simply not populated yet.</Definition></div>
        </Section>
      </div>
    </div>
  );
}
