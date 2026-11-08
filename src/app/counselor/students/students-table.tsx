"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CaseStatusChip, Status, Tag } from "@/components/ui/chips";
import { Input, Select } from "@/components/ui/form";
import { Empty, Section } from "@/components/ui/panels";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { cx } from "@/lib/cx";
import type { StudentRow } from "@/lib/data/counselor";
import { countryName } from "@/mocks/countries";
import type { CaseStatus } from "@/types";

const PAGE = 10;
const STATUS_LABEL: Record<CaseStatus, string> = {
  invited: "Invited", registration_pending: "Registration pending", profile_incomplete: "Profile incomplete", documents_pending: "Documents pending",
  under_counselor_review: "Under review", active: "Active", waiting_for_student: "Waiting for student", waiting_for_counselor: "Waiting for counselor",
  on_hold: "On hold", completed: "Completed", cancelled: "Cancelled", closed: "Closed",
};

export function StudentsTable({ rows }: { rows: StudentRow[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [country, setCountry] = useState("");
  const [pkg, setPkg] = useState("");
  const [completion, setCompletion] = useState("");
  const [attention, setAttention] = useState(false);
  const [page, setPage] = useState(1);

  const countries = useMemo(() => [...new Set(rows.flatMap((r) => r.countries))].sort(), [rows]);
  const packages = useMemo(() => [...new Set(rows.map((r) => r.packageName))].sort(), [rows]);
  const statuses = useMemo(() => [...new Set(rows.map((r) => r.caseStatus))], [rows]);

  const filtered = rows.filter((r) =>
    (!q.trim() || `${r.name} ${r.email}`.toLowerCase().includes(q.trim().toLowerCase())) &&
    (!status || r.caseStatus === status) && (!country || r.countries.includes(country)) && (!pkg || r.packageName === pkg) &&
    (!completion || (completion === "low" ? r.completion < 50 : completion === "mid" ? r.completion >= 50 && r.completion < 100 : r.completion === 100)) &&
    (!attention || r.awaitingReview > 0 || r.corrections > 0 || r.testAlert || r.overdueTasks > 0));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * PAGE, current * PAGE);
  const reset = (fn: () => void) => { fn(); setPage(1); };
  const dirty = q || status || country || pkg || completion || attention;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2" role="search">
        <Input type="search" aria-label="Search students" placeholder="Search name or email" className="max-w-64" value={q} onChange={(e) => reset(() => setQ(e.target.value))} />
        <Select aria-label="Case status" className="w-auto" value={status} onChange={(e) => reset(() => setStatus(e.target.value))}>
          <option value="">All statuses</option>{statuses.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </Select>
        <Select aria-label="Country" className="w-auto" value={country} onChange={(e) => reset(() => setCountry(e.target.value))}>
          <option value="">All countries</option>{countries.map((c) => <option key={c} value={c}>{countryName(c)}</option>)}
        </Select>
        <Select aria-label="Package" className="w-auto" value={pkg} onChange={(e) => reset(() => setPkg(e.target.value))}>
          <option value="">All packages</option>{packages.map((p) => <option key={p}>{p}</option>)}
        </Select>
        <Select aria-label="Profile completion" className="w-auto" value={completion} onChange={(e) => reset(() => setCompletion(e.target.value))}>
          <option value="">Any completion</option><option value="low">Under 50%</option><option value="mid">50% to 99%</option><option value="full">100%</option>
        </Select>
        <button type="button" aria-pressed={attention} onClick={() => reset(() => setAttention((a) => !a))}
          className={cx("press h-8 rounded-full border px-3 text-tiny", attention ? "border-blue-500 bg-info-tint font-medium text-n-100" : "border-line-strong text-n-300 hover:bg-n-850")}>
          Needs attention
        </button>
        {dirty && <Button size="sm" variant="ghost" onClick={() => { setQ(""); setStatus(""); setCountry(""); setPkg(""); setCompletion(""); setAttention(false); setPage(1); }}>Clear</Button>}
      </div>

      <Section flush>
        {filtered.length === 0 ? (
          <Empty title="No students match" action={dirty ? <Button size="sm" onClick={() => { setQ(""); setStatus(""); setCountry(""); setPkg(""); setCompletion(""); setAttention(false); }}>Clear filters</Button> : undefined}>
            {rows.length === 0 ? "No students are assigned to you yet." : "Try removing a filter."}
          </Empty>
        ) : (
          <Table className="max-h-none">
            <colgroup><col className="w-[26%]" /><col className="w-[16%]" /><col className="w-[18%]" /><col className="w-[15%]" /><col className="w-[25%]" /></colgroup>
            <THead><TH>Student</TH><TH>Case</TH><TH>Profile</TH><TH>Destination</TH><TH>Needs attention</TH></THead>
            <tbody>
              {shown.map((r) => (
                <TR key={r.id}>
                  <TD>
                    <Link href={`/counselor/students/${r.id}`} className="block truncate text-sm font-medium text-n-100 hover:underline">{r.name}</Link>
                    <p className="truncate text-n-500">{r.email}</p>
                    {r.access === "shared" && <Tag className="mt-1">Shared by {r.ownerName}</Tag>}
                  </TD>
                  <TD><CaseStatusChip status={r.caseStatus} /><p className="mt-1 text-n-500">{r.packageName}</p></TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-16 rounded-full bg-n-800" aria-hidden><div className={cx("h-full rounded-full", r.completion >= 85 ? "bg-ok-400" : r.completion >= 50 ? "bg-blue-500" : "bg-warn-400")} style={{ width: `${r.completion}%` }} /></div>
                      <span className="tabular-nums text-n-300">{r.completion}%</span>
                    </div>
                    <p className="mt-1 text-n-500 tabular-nums">{r.missingCount ? `${r.missingCount} missing` : "Complete"}</p>
                  </TD>
                  <TD className="text-n-300">{r.countries.length ? r.countries.map(countryName).join(", ") : <span className="text-n-500">Not chosen</span>}</TD>
                  <TD>
                    <div className="flex flex-wrap gap-1.5">
                      {r.awaitingReview > 0 && <Status tone="info">{r.awaitingReview} to review</Status>}
                      {r.corrections > 0 && <Status tone="warn">Correction open</Status>}
                      {r.unverifiedCount > 0 && <Status tone="neutral">{r.unverifiedCount} unverified</Status>}
                      {r.testAlert && <Status tone={r.testAlert === "expired" ? "bad" : "warn"}>Test {r.testAlert}</Status>}
                      {r.overdueTasks > 0 && <Status tone="bad">{r.overdueTasks} overdue</Status>}
                      {!r.awaitingReview && !r.corrections && !r.unverifiedCount && !r.testAlert && !r.overdueTasks && <span className="text-n-500">Nothing</span>}
                    </div>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
        {filtered.length > PAGE && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3 text-tiny text-n-400">
            <span className="tabular-nums">{(current - 1) * PAGE + 1} to {Math.min(current * PAGE, filtered.length)} of {filtered.length}</span>
            <div className="flex gap-2">
              <Button size="sm" disabled={current === 1} onClick={() => setPage(current - 1)}>Previous</Button>
              <Button size="sm" disabled={current === pages} onClick={() => setPage(current + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
