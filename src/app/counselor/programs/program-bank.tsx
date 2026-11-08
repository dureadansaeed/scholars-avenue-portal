"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { MatchChip, RecordStatusChip, SampleTag, Status, Tag } from "@/components/ui/chips";
import { Input, Select } from "@/components/ui/form";
import { Segmented } from "@/components/ui/navigation";
import { SelectionBar, SidePanel } from "@/components/ui/overlays";
import { Empty, Note, Section } from "@/components/ui/panels";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { cx } from "@/lib/cx";
import { decisionKey, mergeById, useCounselorWork } from "@/lib/counselor-work";
import { formatDate } from "@/lib/clock";
import { matchProgram, type StudentFacts } from "@/lib/eligibility";
import { deadlineText } from "@/lib/program-format";
import { applyFilters, deadlineState, flatten, freshnessWarnings, NO_FILTERS, uniq, type BankData, type BankFilters } from "@/lib/program-search";
import { countryName } from "@/mocks/countries";
import type { MatchResult, ShortlistEntry } from "@/types";
import { AddToShortlist } from "./add-to-shortlist";
import { CompareSheet } from "./compare-sheet";
import { ProgramDetail } from "./program-detail";

export interface MatchableStudent {
  id: string; name: string; caseId: string; facts: StudentFacts; package: { name: string; maxApplications: number | null }; shortlistedKeys: string[];
}
type Sort = "match" | "deadline" | "name";
const ORDER = { confirmed: 0, possible: 1, mismatch: 2 } as const;
const DEADLINE_SORT = { soon: 0, open: 1, unknown: 2, passed: 3 } as const;

export function ProgramBank({ counselorId, bank, students }: { counselorId: string; bank: BankData; students: MatchableStudent[] }) {
  const params = useSearchParams();
  const wanted = params.get("student");
  const [studentId, setStudentId] = useState(wanted && students.some((s) => s.id === wanted) ? wanted : "");
  const [f, setF] = useState<BankFilters>(NO_FILTERS);
  const [sort, setSort] = useState<Sort>("name");
  const [selected, setSelected] = useState<string[]>([]);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);
  const w = useCounselorWork(counselorId);

  const student = students.find((s) => s.id === studentId);
  const all = useMemo(() => flatten(bank), [bank]);
  const set = <K extends keyof BankFilters>(k: K, v: BankFilters[K]) => setF((x) => ({ ...x, [k]: v }));

  const matches = useMemo(() => {
    const m = new Map<string, MatchResult>();
    if (student) for (const r of all) m.set(r.key, matchProgram(student.facts, r.program, r.intake.id));
    return m;
  }, [student, all]);

  const rows = useMemo(() => {
    const filtered = applyFilters(all, f);
    return [...filtered].sort((a, b) => {
      if (sort === "match" && student) return ORDER[matches.get(a.key)!.overall] - ORDER[matches.get(b.key)!.overall] || a.program.name.localeCompare(b.program.name);
      if (sort === "deadline") return DEADLINE_SORT[deadlineState(a.intake)] - DEADLINE_SORT[deadlineState(b.intake)] || (a.intake.deadline.kind === "fixed" && b.intake.deadline.kind === "fixed" ? Date.parse(a.intake.deadline.date) - Date.parse(b.intake.deadline.date) : 0);
      return a.program.countryCode.localeCompare(b.program.countryCode) || a.program.name.localeCompare(b.program.name);
    });
  }, [all, f, sort, student, matches]);

  const open = all.find((r) => r.key === openKey) ?? null;
  const addRow = all.find((r) => r.key === adding) ?? null;
  const shortlistEntries: ShortlistEntry[] = mergeById([], w.work.shortlist);
  const existingFor = (key: string): ShortlistEntry | undefined => {
    if (!student) return undefined;
    const [pid, iid] = key.split("|");
    const overlay = shortlistEntries.find((e) => e.studentId === student.id && e.programId === pid && e.intakeId === iid && e.status !== "removed");
    return overlay ?? (student.shortlistedKeys.includes(key) ? ({ status: "shared" } as ShortlistEntry) : undefined);
  };

  const countries = uniq(bank.programs.map((p) => p.countryCode));
  const dirty = JSON.stringify(f) !== JSON.stringify(NO_FILTERS);
  const toggle = (key: string) => setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : s.length >= 4 ? s : [...s, key]));
  const compareItems = selected.map((k) => all.find((r) => r.key === k)!).filter(Boolean).map((row) => ({ row, match: matches.get(row.key) }));

  const decisionFor = (key: string) => (student ? w.work.decisions[decisionKey(student.id, ...(key.split("|") as [string, string]))] : undefined);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-surface p-4">
        <div className="min-w-56 flex-1 sm:flex-none">
          <label htmlFor="match-student" className="mb-1 block text-micro font-medium tracking-wide text-n-400 uppercase">Match against student</label>
          <Select id="match-student" value={studentId} onChange={(e) => { setStudentId(e.target.value); if (e.target.value) setSort("match"); else if (sort === "match") setSort("name"); }}>
            <option value="">No student (browse only)</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </div>
        <div className="min-w-48 flex-1">
          <label htmlFor="bank-q" className="mb-1 block text-micro font-medium tracking-wide text-n-400 uppercase">Search</label>
          <Input id="bank-q" type="search" placeholder="Programme, university, subject, city" value={f.q} onChange={(e) => set("q", e.target.value)} />
        </div>
        <Segmented label="Sort" size="sm" value={sort} onChange={setSort}
          options={[{ value: "name", label: "Country" }, { value: "deadline", label: "Deadline" }, ...(student ? [{ value: "match" as Sort, label: "Best match" }] : [])]} />
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filters">
        <Select aria-label="Country" className="w-auto" value={f.country} onChange={(e) => set("country", e.target.value)}><option value="">All countries</option>{countries.map((c) => <option key={c} value={c}>{countryName(c)}</option>)}</Select>
        <Select aria-label="Degree" className="w-auto" value={f.degree} onChange={(e) => set("degree", e.target.value)}><option value="">All degrees</option><option value="bachelor">Bachelor&apos;s</option><option value="master">Master&apos;s</option><option value="phd">PhD</option></Select>
        <Select aria-label="Subject" className="w-auto" value={f.subject} onChange={(e) => set("subject", e.target.value)}><option value="">All subjects</option>{uniq(bank.programs.map((p) => p.subject)).map((s) => <option key={s}>{s}</option>)}</Select>
        <Select aria-label="Intake" className="w-auto" value={f.intake} onChange={(e) => set("intake", e.target.value)}><option value="">All intakes</option>{uniq(bank.programs.flatMap((p) => p.intakes.map((i) => i.name))).map((s) => <option key={s}>{s}</option>)}</Select>
        <Select aria-label="Deadline" className="w-auto" value={f.deadline} onChange={(e) => set("deadline", e.target.value as BankFilters["deadline"])}>
          <option value="">Any deadline</option><option value="open">Open (incl. rolling)</option><option value="soon">Closing within 30 days</option><option value="passed">Passed</option><option value="unknown">Not published</option></Select>
        <Select aria-label="Verification" className="w-auto" value={f.verification} onChange={(e) => set("verification", e.target.value as BankFilters["verification"])}>
          <option value="">Any record status</option><option value="verified">Verified</option><option value="pending_review">Pending review</option><option value="draft">Draft</option><option value="needs_update">Needs update</option><option value="outdated">Outdated</option><option value="archived">Archived</option></Select>
        <button type="button" aria-expanded={showMore} onClick={() => setShowMore((s) => !s)} className="press h-8 rounded-full border border-line-strong px-3 text-tiny text-n-300 hover:bg-n-850">{showMore ? "Fewer filters" : "More filters"}</button>
        {dirty && <Button size="sm" variant="ghost" onClick={() => setF(NO_FILTERS)}>Clear</Button>}
      </div>
      {showMore && (
        <div className="flex flex-wrap items-center gap-2 rounded-md bg-raised p-3" role="group" aria-label="More filters">
          <Select aria-label="Language of instruction" className="w-auto" value={f.language} onChange={(e) => set("language", e.target.value)}><option value="">Any language</option>{uniq(bank.programs.flatMap((p) => p.languageOfInstruction)).map((l) => <option key={l}>{l}</option>)}</Select>
          <Select aria-label="City" className="w-auto" value={f.city} onChange={(e) => set("city", e.target.value)}><option value="">Any city</option>{bank.cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
          <Select aria-label="Application route" className="w-auto" value={f.route} onChange={(e) => set("route", e.target.value)}><option value="">Any route</option><option value="uni_assist">Uni-Assist</option><option value="direct_portal">University portal</option><option value="centralized_portal">Central portal</option></Select>
          <Select aria-label="University type" className="w-auto" value={f.type} onChange={(e) => set("type", e.target.value as BankFilters["type"])}><option value="">Public or private</option><option value="public">Public</option><option value="private">Private</option></Select>
          <Select aria-label="Scholarship" className="w-auto" value={f.scholarship} onChange={(e) => set("scholarship", e.target.value as BankFilters["scholarship"])}><option value="">Scholarship: any</option><option value="yes">Available</option><option value="unknown">Not recorded</option></Select>
          <Input aria-label="Maximum tuition per year in EUR" className="w-44" inputMode="numeric" placeholder="Max tuition / year (EUR)" value={f.maxTuition} onChange={(e) => set("maxTuition", e.target.value)} />
          <label className="flex items-center gap-2 text-tiny text-n-300"><input type="checkbox" className="size-4 accent-blue-500" checked={f.includeArchived} onChange={(e) => set("includeArchived", e.target.checked)} />Include archived</label>
          {f.maxTuition && <span className="text-tiny text-n-500">Programmes with an unknown fee stay in the list.</span>}
        </div>
      )}

      {toast && <Note tone="ok" action={<button type="button" className="text-tiny opacity-60 hover:opacity-100" onClick={() => setToast(null)}>Dismiss</button>}>{toast}</Note>}
      {student && <Note title={`Matching against ${student.name}`}>Each result is a rule-based check of the records held, not an admission decision. Missing or unverified data shows as unknown, never as a pass.</Note>}

      <Section flush title={`${rows.length} programme intake${rows.length === 1 ? "" : "s"}`} description="One row per programme and intake, because requirements and deadlines can differ by intake." actions={<SampleTag />}>
        {rows.length === 0 ? (
          <Empty title="No programmes match these filters" action={dirty ? <Button size="sm" onClick={() => setF(NO_FILTERS)}>Clear filters</Button> : undefined}>Missing data never hides a programme, so try loosening a filter.</Empty>
        ) : (
          <Table className="max-h-[36rem]">
            <colgroup><col className="w-10" /><col className="w-[30%]" /><col className="w-[20%]" /><col className="w-[22%]" />{student && <col className="w-[22%]" />}</colgroup>
            <THead><TH><span className="sr-only">Compare</span></TH><TH>Programme</TH><TH>Intake and deadline</TH><TH>Record</TH>{student && <TH>Match</TH>}</THead>
            <tbody>
              {rows.map((r) => {
                const m = matches.get(r.key);
                const dl = deadlineText(r.intake);
                const state = deadlineState(r.intake);
                const warn = freshnessWarnings(r.program, r.intake);
                const d = decisionFor(r.key);
                const dup = existingFor(r.key);
                return (
                  <TR key={r.key} className={cx(openKey === r.key && "bg-n-850/70")}>
                    <TD><input type="checkbox" className="size-4 accent-blue-500" aria-label={`Select ${r.program.name} ${r.intake.name} to compare`} checked={selected.includes(r.key)}
                      disabled={!selected.includes(r.key) && selected.length >= 4} onChange={() => toggle(r.key)} /></TD>
                    <TD>
                      <button type="button" onClick={() => setOpenKey(r.key)} className="block max-w-full text-left">
                        <span className="block truncate text-sm font-medium text-n-100 hover:underline">{r.program.degreeTitle} {r.program.name}</span>
                        <span className="block truncate text-n-400">{r.university.name}</span>
                        <span className="block truncate text-n-500">{r.city.name}, {countryName(r.program.countryCode)}</span>
                      </button>
                      {dup && <Tag className="mt-1">On shortlist</Tag>}
                    </TD>
                    <TD>
                      <p className="text-n-200">{r.intake.name}</p>
                      <p className={cx("tabular-nums", state === "unknown" ? "text-warn-400" : state === "passed" ? "text-bad-400" : "text-n-400")}>
                        {state === "unknown" ? "Not published" : state === "passed" ? `Passed ${dl.value}` : dl.value}
                      </p>
                    </TD>
                    <TD>
                      <RecordStatusChip status={r.program.status} />
                      {warn.length > 0 && <p className="mt-1 line-clamp-2 text-n-500" title={warn.join(" ")}>{warn[0]}{warn.length > 1 && ` +${warn.length - 1} more`}</p>}
                      {r.program.source.lastCheckedAt && <p className="text-n-500 tabular-nums">Checked {formatDate(r.program.source.lastCheckedAt)}</p>}
                    </TD>
                    {student && m && (
                      <TD>
                        <MatchChip overall={m.overall} />
                        {d && <p className="mt-1"><Status tone={d.decision === "accepted" ? "ok" : "neutral"}>You: {d.decision === "accepted" ? "accepted" : "not suitable"}</Status></p>}
                      </TD>
                    )}
                  </TR>
                );
              })}
            </tbody>
          </Table>
        )}
      </Section>

      <SelectionBar open={selected.length > 0}>
        <span className="tabular-nums">{selected.length} selected</span>
        <Button size="sm" variant="primary" disabled={selected.length < 2} onClick={() => setComparing(true)}>Compare{selected.length < 2 ? " (pick 2 to 4)" : ""}</Button>
        <Button size="sm" variant="ghost" onClick={() => setSelected([])}>Clear</Button>
      </SelectionBar>

      <SidePanel open={!!open} onClose={() => setOpenKey(null)} title={open ? `${open.program.degreeTitle} ${open.program.name}` : ""}
        description={open ? `${open.university.name}, ${open.city.name}` : undefined}
        footer={open ? (
          <>
            <Button onClick={() => { toggle(open.key); setToast(selected.includes(open.key) ? "Removed from comparison." : "Added to comparison. Select 2 to 4 to compare."); }}>
              {selected.includes(open.key) ? "Remove from comparison" : "Add to comparison"}
            </Button>
            <Button variant="primary" disabled={!student} title={student ? undefined : "Choose a student first"} onClick={() => setAdding(open.key)}>
              {student ? `Add to ${student.name.split(" ")[0]}'s shortlist` : "Choose a student to shortlist"}
            </Button>
          </>
        ) : undefined}>
        {open && (
          <ProgramDetail row={open} student={student} match={matches.get(open.key)} facts={student?.facts} decision={decisionFor(open.key)}
            onDecide={(d) => w.setDecision(decisionKey(student!.id, open.program.id, open.intake.id), d)}
            onClearDecision={() => w.clearDecision(decisionKey(student!.id, open.program.id, open.intake.id))} />
        )}
      </SidePanel>

      <AddToShortlist key={adding ?? "none"} row={addRow} studentName={student?.name ?? ""} match={addRow ? matches.get(addRow.key) : undefined}
        existing={addRow ? existingFor(addRow.key) : undefined} onClose={() => setAdding(null)}
        onAdd={(d) => {
          if (!addRow || !student) return;
          w.addToShortlist({ studentId: student.id, caseId: student.caseId, program: addRow.program, intakeId: addRow.intake.id, ...d });
          setToast(`${addRow.program.name} (${addRow.intake.name}) was added to ${student.name}'s shortlist as an internal proposal. Share it from their Shortlist tab when you are ready.`);
          setAdding(null); setOpenKey(null);
        }} />

      {comparing && compareItems.length >= 2 && <CompareSheet open onClose={() => setComparing(false)} items={compareItems} studentName={student?.name} />}
    </div>
  );
}
