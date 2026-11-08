"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ReadOnlyNote, usePermissions, type AdminIdentity } from "@/components/admin/permissions";
import { Button } from "@/components/ui/button";
import { Status } from "@/components/ui/chips";
import { Select } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Segmented } from "@/components/ui/navigation";
import { Empty, Metric, Note, Section } from "@/components/ui/panels";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { DEMO_NOW, formatDateTime } from "@/lib/clock";
import { downloadText, parseCsv, toCsv } from "@/lib/csv";
import { cx } from "@/lib/cx";
import type { getImportHistory } from "@/lib/data/admin";
import { autoMap, IMPORT_FIELDS, missingRequired, SAMPLE_CSV, validateImport, type ImportField, type Mapping, type RowResult } from "@/lib/program-import";
import { requirementRows } from "@/lib/program-format";
import { newId } from "@/lib/use-local-state";
import type { ImportBatch } from "@/types";
import { useCatalog, type CatalogData } from "../catalog/use-catalog";

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 2000;
type Step = "upload" | "map" | "review" | "done";
const RESULT: Record<RowResult["result"], [React.ComponentProps<typeof Status>["tone"], string]> = {
  valid: ["ok", "Will import"], error: ["bad", "Error"], duplicate: ["neutral", "Duplicate"], conflict: ["warn", "Conflict"],
};

export function ImportView({ admin, catalog, history }: { admin: AdminIdentity; catalog: CatalogData; history: Awaited<ReturnType<typeof getImportHistory>> }) {
  const { w, programs, universities, cities } = useCatalog(admin.id, catalog);
  const perm = usePermissions(admin);
  const canImport = perm.can("catalog.manage");
  const canExport = perm.can("reports.export");

  const [step, setStep] = useState<Step>("upload");
  const [filename, setFilename] = useState("");
  const [table, setTable] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [fileError, setFileError] = useState<string>();
  const [filter, setFilter] = useState<"all" | RowResult["result"]>("all");
  const [batchId] = useState(() => newId("imp"));
  const [done, setDone] = useState<ImportBatch | null>(null);

  const header = table[0] ?? [];
  const body = table.slice(1);
  const results = useMemo(() => (step === "review" ? validateImport(body, mapping, { universities, cities, programs }, newId, batchId) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute only when entering review or the inputs change
    [step, table, mapping, universities, cities, programs, batchId]);
  const counts = { valid: 0, error: 0, duplicate: 0, conflict: 0 } as Record<RowResult["result"], number>;
  results.forEach((r) => counts[r.result]++);
  const shown = results.filter((r) => filter === "all" || r.result === filter);

  const load = (name: string, text: string) => {
    const parsed = parseCsv(text);
    if (parsed.length < 2) { setFileError("The file needs a header row and at least one data row."); return; }
    if (parsed.length - 1 > MAX_ROWS) { setFileError(`The file has ${parsed.length - 1} rows. Split it into files of ${MAX_ROWS} rows or fewer.`); return; }
    setFileError(undefined); setFilename(name); setTable(parsed); setMapping(autoMap(parsed[0])); setStep("map");
  };
  const pick = async (f?: File) => {
    if (!f) return;
    if (!/\.csv$/i.test(f.name)) { setFileError("Upload a .csv file. In Excel or Google Sheets use File, then Save as / Download as CSV."); return; }
    if (f.size > MAX_BYTES) { setFileError("The file is over 2 MB."); return; }
    load(f.name, await f.text());
  };

  const apply = () => {
    const created = results.filter((r) => r.result === "valid").map((r) => r.program!);
    const batch: ImportBatch = {
      id: batchId, filename, importedBy: admin.id, importedAt: DEMO_NOW, applied: created.length,
      rows: results.map((r) => ({ row: r.row, name: r.name, result: r.result, message: r.message })),
    };
    w.importPrograms(batch, created);
    setDone(batch); setStep("done");
  };
  const errorReport = (rows: ImportBatch["rows"], name: string) =>
    downloadText(`${name.replace(/\.csv$/i, "")}-report.csv`, toCsv([["Row", "Programme", "Result", "Message"], ...rows.filter((r) => r.result !== "valid").map((r) => [r.row, r.name, r.result, r.message ?? ""])]));

  const exportProgrammes = () => {
    const rows = programs.map((p) => {
      const u = universities.find((x) => x.id === p.universityId);
      const req = Object.fromEntries(requirementRows(p).map((r) => [r.label, r.value]));
      return [p.id, u?.name ?? "", p.degreeTitle, p.name, p.degreeLevel, p.countryCode, p.status, p.source.lastCheckedAt ?? "", p.source.url ?? "",
        p.intakes.map((i) => `${i.name}: ${i.deadline.kind === "fixed" ? i.deadline.date : i.deadline.kind}`).join("; "),
        req["Previous qualification"], req["Minimum grade"], req["Language test"]];
    });
    downloadText(`programmes-${DEMO_NOW.slice(0, 10)}.csv`, toCsv([["ID", "University", "Degree", "Programme", "Level", "Country", "Record status", "Last checked", "Source", "Intakes", "Qualification", "Minimum grade", "Language"], ...rows]));
    w.logExport("programmes", rows.length);
  };

  const batches = [...w.work.batches, ...history.batches];

  return (
    <div className="space-y-4">
      {!canImport && <ReadOnlyNote perm="catalog.manage" />}

      <Section title="Import programmes" description="Upload, map columns, review every row, then apply. Nothing changes until the last step."
        actions={<Button size="sm" onClick={() => downloadText("programme-import-template.csv", SAMPLE_CSV)}><Icon.Download className="size-3.5" />Template</Button>}>
        <ol className="mb-5 flex flex-wrap gap-2 text-tiny" aria-label="Import steps">
          {(["upload", "map", "review", "done"] as Step[]).map((s, i) => (
            <li key={s} aria-current={step === s ? "step" : undefined}
              className={cx("rounded-full px-3 py-1", step === s ? "bg-accent text-n-950" : "bg-n-850 text-n-400")}>{i + 1}. {{ upload: "Upload", map: "Map columns", review: "Review rows", done: "Applied" }[s]}</li>
          ))}
        </ol>

        {step === "upload" && (
          <div className="space-y-3">
            <label className={cx("flex flex-col items-center gap-2 rounded-md border border-dashed border-line-strong bg-raised px-6 py-10 text-center", canImport ? "cursor-pointer hover:bg-n-850" : "cursor-not-allowed opacity-60")}>
              <Icon.Upload className="size-5 text-n-500" />
              <span className="text-sm text-n-200">Choose a CSV file</span>
              <span className="text-tiny text-n-500">Up to 2 MB and {MAX_ROWS} rows. First row is the header.</span>
              <input type="file" accept=".csv,text/csv" className="sr-only" disabled={!canImport} onChange={(e) => pick(e.target.files?.[0])} />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <Button disabled={!canImport} onClick={() => load("sample-programmes.csv", SAMPLE_CSV)}>Try it with the sample file</Button>
              <span className="text-tiny text-n-500">The sample includes an error, a duplicate and a conflict on purpose.</span>
            </div>
            {fileError && <Note tone="bad">{fileError}</Note>}
          </div>
        )}

        {step === "map" && (
          <div className="space-y-4">
            <p className="text-sm text-n-300"><span className="font-medium text-n-100">{filename}</span> · <span className="tabular-nums">{body.length}</span> rows. Columns were matched by name; check each one.</p>
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {IMPORT_FIELDS.map((f) => (
                <div key={f.key} className="flex items-center justify-between gap-3">
                  <label htmlFor={`map-${f.key}`} className="text-sm text-n-200">{f.label}{f.required && <span className="ml-1.5 text-tiny text-n-500">Required</span>}
                    {f.hint && <span className="block text-tiny text-n-500">{f.hint}</span>}</label>
                  <Select id={`map-${f.key}`} className="w-48" value={mapping[f.key] ?? ""} onChange={(e) => setMapping((m) => {
                    const next = { ...m }; if (e.target.value === "") delete next[f.key as ImportField]; else next[f.key as ImportField] = Number(e.target.value); return next;
                  })}>
                    <option value="">Not in file (unknown)</option>{header.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                  </Select>
                </div>
              ))}
            </div>
            {missingRequired(mapping).length > 0 && <Note tone="warn">Map the required fields: {missingRequired(mapping).join(", ")}.</Note>}
            <Note>A field that is not in the file stays unknown on the imported record. It is never read as “no requirement”.</Note>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => { setStep("upload"); setTable([]); }}>Start over</Button>
              <Button variant="primary" disabled={missingRequired(mapping).length > 0} onClick={() => { setFilter("all"); setStep("review"); }}>Check rows</Button>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Metric label="Will import" value={<span className="text-ok-400">{counts.valid}</span>} hint="As pending review" />
              <Metric label="Errors" value={<span className={cx(counts.error > 0 && "text-bad-400")}>{counts.error}</span>} hint="Fix in the file" />
              <Metric label="Duplicates" value={counts.duplicate} hint="Skipped" />
              <Metric label="Conflicts" value={<span className={cx(counts.conflict > 0 && "text-warn-400")}>{counts.conflict}</span>} hint="Need a person to decide" />
            </dl>
            <Segmented label="Rows" size="sm" value={filter} onChange={setFilter} options={[
              { value: "all", label: "All", count: results.length }, { value: "valid", label: "Will import", count: counts.valid },
              { value: "error", label: "Errors", count: counts.error }, { value: "duplicate", label: "Duplicates", count: counts.duplicate }, { value: "conflict", label: "Conflicts", count: counts.conflict },
            ]} />
            <div className="rounded-md border border-line">
              <Table className="max-h-96">
                <colgroup><col className="w-16" /><col className="w-[36%]" /><col className="w-[16%]" /><col /></colgroup>
                <THead><TH>Row</TH><TH>Programme</TH><TH>Result</TH><TH>Details</TH></THead>
                <tbody>
                  {shown.map((r) => (
                    <TR key={r.row}>
                      <TD className="tabular-nums text-n-400">{r.row}</TD>
                      <TD className="text-n-100">{r.name}</TD>
                      <TD><Status tone={RESULT[r.result][0]}>{RESULT[r.result][1]}</Status></TD>
                      <TD className="text-n-300">{r.message ?? (r.program ? `${r.program.intakes[0].name} · requirements not in the file stay unknown` : "")}</TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
            </div>
            {counts.valid === 0 ? <Note tone="warn">No rows can be imported. Fix the file and upload it again.</Note>
              : <Note>Applying adds {counts.valid} programme{counts.valid > 1 ? "s" : ""} as <strong>pending review</strong>, tagged with this import batch. Errors, duplicates and conflicts are not applied, and no existing record is changed.</Note>}
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => setStep("map")}>Back to mapping</Button>
              {(counts.error + counts.duplicate + counts.conflict) > 0 && <Button onClick={() => errorReport(results.map((r) => ({ row: r.row, name: r.name, result: r.result, message: r.message })), filename)}><Icon.Download className="size-3.5" />Problem report</Button>}
              <Button variant="primary" disabled={counts.valid === 0 || !canImport} onClick={apply}>Apply {counts.valid} row{counts.valid === 1 ? "" : "s"}</Button>
            </div>
          </div>
        )}

        {step === "done" && done && (
          <div className="space-y-3">
            <Note tone="ok" title={`${done.applied} programme${done.applied === 1 ? "" : "s"} imported as pending review`}>
              Review and verify them against their official sources in the <Link href="/admin/catalog?filter=attention" className="font-medium underline underline-offset-2">catalog</Link>.
            </Note>
            <div className="flex gap-2">
              <Button onClick={() => { setStep("upload"); setTable([]); setFilename(""); setDone(null); }}>Import another file</Button>
              {done.rows.some((r) => r.result !== "valid") && <Button onClick={() => errorReport(done.rows, done.filename)}><Icon.Download className="size-3.5" />Problem report</Button>}
            </div>
          </div>
        )}
      </Section>

      <Section title="Export" description="Downloads are generated in your browser from the records you can see, and each one is noted in the audit log.">
        {!canExport && <div className="mb-3"><ReadOnlyNote perm="reports.export" /></div>}
        <div className="flex flex-wrap gap-2">
          <Button disabled={!canExport} title={canExport ? undefined : perm.why("reports.export")} onClick={exportProgrammes}><Icon.Download className="size-3.5" />Programmes (CSV)</Button>
          <Link href="/admin/reports" className="inline-flex h-9 items-center px-2 text-sm font-medium text-link hover:underline">Report exports are on Reports</Link>
        </div>
      </Section>

      <Section title="Import history" description="Every batch with its file, who ran it and what happened to each row." flush>
        {batches.length === 0 ? <Empty title="No imports yet" /> : (
          <ul className="divide-y divide-line">
            {batches.map((b) => {
              const c = { valid: 0, error: 0, duplicate: 0, conflict: 0 } as Record<RowResult["result"], number>;
              b.rows.forEach((r) => c[r.result]++);
              return (
                <li key={b.id} className="px-5 py-3">
                  <details>
                    <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-n-100">{b.filename}</span>
                        <span className="block text-tiny text-n-500 tabular-nums">{formatDateTime(b.importedAt)} · {b.importedBy === admin.id ? "you" : history.names[b.importedBy] ?? b.importedBy}</span>
                      </span>
                      <span className="flex flex-wrap gap-1.5">
                        <Status tone="ok">{b.applied} applied</Status>
                        {c.error > 0 && <Status tone="bad">{c.error} errors</Status>}
                        {c.duplicate > 0 && <Status tone="neutral">{c.duplicate} duplicates</Status>}
                        {c.conflict > 0 && <Status tone="warn">{c.conflict} conflicts</Status>}
                      </span>
                    </summary>
                    <ul className="mt-2 space-y-1 text-tiny">
                      {b.rows.map((r) => <li key={r.row} className="text-n-300"><span className="tabular-nums text-n-500">Row {r.row}</span> · {r.name} · <span className="font-medium">{RESULT[r.result][1]}</span>{r.message && <span className="text-n-500"> · {r.message}</span>}</li>)}
                    </ul>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}
