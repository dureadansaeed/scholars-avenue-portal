"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ReadOnlyNote, usePermissions, type AdminIdentity } from "@/components/admin/permissions";
import { buttonClass } from "@/components/ui/button-styles";
import { RecordStatusChip, SampleTag, Status } from "@/components/ui/chips";
import { Input, Select } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Segmented } from "@/components/ui/navigation";
import { Empty, Section } from "@/components/ui/panels";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { isStale, RECORD_LABEL } from "@/lib/catalog-rules";
import { formatDate } from "@/lib/clock";
import { freshnessWarnings } from "@/lib/program-search";
import type { RecordStatus } from "@/types";
import { useCatalog, type CatalogData } from "./use-catalog";

type View = "all" | "attention" | "archived";

export function ProgramsList({ admin, data }: { admin: AdminIdentity; data: CatalogData }) {
  const params = useSearchParams();
  const { programs, universities, countries, linked } = useCatalog(admin.id, data);
  const perm = usePermissions(admin);
  const canEdit = perm.can("catalog.manage");
  const [view, setView] = useState<View>(params.get("filter") === "attention" ? "attention" : "all");
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [status, setStatus] = useState<"" | RecordStatus>("");

  const uni = (id: string) => universities.find((u) => u.id === id);
  const warn = (p: (typeof programs)[number]) => freshnessWarnings(p, p.intakes[0] ?? { deadline: { kind: "rolling" } } as never).filter((x) => !x.startsWith("Deadline"));
  const needs = (p: (typeof programs)[number]) => p.status !== "archived" && (p.status !== "verified" || isStale(p) || warn(p).length > 0);
  const needle = q.trim().toLowerCase();
  const rows = programs.filter((p) => (view === "archived" ? p.status === "archived" : view === "attention" ? needs(p) : p.status !== "archived")
    && (!needle || `${p.name} ${p.degreeTitle} ${p.subject} ${uni(p.universityId)?.name ?? ""}`.toLowerCase().includes(needle))
    && (!country || p.countryCode === country) && (!status || p.status === status))
    .sort((a, b) => a.countryCode.localeCompare(b.countryCode) || a.name.localeCompare(b.name));

  return (
    <div className="space-y-4">
      {!canEdit && <ReadOnlyNote perm="catalog.manage" />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Programmes" size="sm" value={view} onChange={setView} options={[
          { value: "all", label: "Current", count: programs.filter((p) => p.status !== "archived").length },
          { value: "attention", label: "Needs attention", count: programs.filter(needs).length },
          { value: "archived", label: "Archived", count: programs.filter((p) => p.status === "archived").length },
        ]} />
        {canEdit
          ? <Link href="/admin/catalog/programs/new" className={buttonClass("primary", "md")}><Icon.Plus className="size-4" />New programme</Link>
          : <span className={buttonClass("primary", "md", "cursor-not-allowed opacity-50")} aria-disabled="true" title={perm.why("catalog.manage")}><Icon.Plus className="size-4" />New programme</span>}
      </div>
      <div className="flex flex-wrap items-center gap-2" role="search">
        <Input type="search" aria-label="Search programmes" placeholder="Programme, subject or university" className="max-w-64" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select aria-label="Country" className="w-auto" value={country} onChange={(e) => setCountry(e.target.value)}>
          <option value="">All countries</option>{countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </Select>
        <Select aria-label="Record status" className="w-auto" value={status} onChange={(e) => setStatus(e.target.value as RecordStatus | "")}>
          <option value="">Any record status</option>{(Object.keys(RECORD_LABEL) as RecordStatus[]).map((s) => <option key={s} value={s}>{RECORD_LABEL[s]}</option>)}
        </Select>
      </div>

      <Section flush title={`${rows.length} programme${rows.length === 1 ? "" : "s"}`} actions={<SampleTag />}>
        {rows.length === 0 ? <Empty title="No programmes match">Try another view or clear the search.</Empty> : (
          <Table className="max-h-none">
            <colgroup><col className="w-[34%]" /><col className="w-[14%]" /><col className="w-[12%]" /><col className="w-[22%]" /><col className="w-[18%]" /></colgroup>
            <THead><TH>Programme</TH><TH>Country</TH><TH>Intakes</TH><TH>Record</TH><TH>Applications</TH></THead>
            <tbody>
              {rows.map((p) => {
                const w = warn(p);
                return (
                  <TR key={p.id}>
                    <TD>
                      <Link href={`/admin/catalog/programs/${p.id}`} className="block truncate text-sm font-medium text-n-100 hover:underline">{p.degreeTitle} {p.name}</Link>
                      <p className="truncate text-n-500">{uni(p.universityId)?.name ?? "No university"}</p>
                    </TD>
                    <TD className="text-n-300">{countries.find((c) => c.code === p.countryCode)?.name ?? p.countryCode}</TD>
                    <TD className="tabular-nums text-n-300">{p.intakes.length}</TD>
                    <TD>
                      <div className="flex flex-wrap gap-1"><RecordStatusChip status={p.status} />{isStale(p) && <Status tone="warn">Stale</Status>}</div>
                      <p className="mt-1 truncate text-n-500" title={w.join(" ")}>{p.source.lastCheckedAt ? `Checked ${formatDate(p.source.lastCheckedAt)}` : "Never checked"}</p>
                    </TD>
                    <TD className="text-n-300 tabular-nums">{linked[p.id] ?? 0}<span className="text-n-500"> linked</span></TD>
                  </TR>
                );
              })}
            </tbody>
          </Table>
        )}
      </Section>
    </div>
  );
}
