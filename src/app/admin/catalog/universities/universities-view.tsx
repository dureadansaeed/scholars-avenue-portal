"use client";

import { useState } from "react";
import { ReadOnlyNote, usePermissions, type AdminIdentity } from "@/components/admin/permissions";
import { Button } from "@/components/ui/button";
import { RecordStatusChip, Tag } from "@/components/ui/chips";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/overlays";
import { Empty, Note, Section } from "@/components/ui/panels";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { RECORD_LABEL } from "@/lib/catalog-rules";
import { DEMO_NOW, formatDate } from "@/lib/clock";
import { newId } from "@/lib/use-local-state";
import type { RecordStatus, University } from "@/types";
import { useCatalog, type CatalogData } from "../use-catalog";

const URL_RE = /^https?:\/\/\S+$/;

export function UniversitiesView({ admin, data }: { admin: AdminIdentity; data: CatalogData }) {
  const { w, universities, cities, countries, programs } = useCatalog(admin.id, data);
  const perm = usePermissions(admin);
  const canEdit = perm.can("catalog.manage");
  const [country, setCountry] = useState("");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<{ before: University | null; draft: University; rank: { organisation: string; year: string; position: string } } | null>(null);
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const needle = q.trim().toLowerCase();
  const rows = universities.filter((u) => (!country || u.countryCode === country) && (!needle || `${u.name} ${u.abbreviations.join(" ")}`.toLowerCase().includes(needle)))
    .sort((a, b) => a.countryCode.localeCompare(b.countryCode) || a.name.localeCompare(b.name));

  const open = (u?: University) => {
    const draft = structuredClone(u ?? {
      id: newId("uni"), countryCode: country || "DE", cityIds: [], name: "", abbreviations: [], type: null, website: null, admissionsUrl: null,
      status: "draft" as RecordStatus, source: { url: null, verification: "draft" as RecordStatus, lastCheckedAt: null },
    });
    setEditing({ before: u ?? null, draft, rank: { organisation: draft.ranking?.organisation ?? "", year: draft.ranking ? String(draft.ranking.year) : "", position: draft.ranking ? String(draft.ranking.position) : "" } });
    setErrors({}); setReason("");
  };
  const set = <K extends keyof University>(k: K, v: University[K]) => setEditing((e) => (e ? { ...e, draft: { ...e.draft, [k]: v } } : e));

  const save = () => {
    if (!editing) return;
    const d = editing.draft;
    const rk = editing.rank;
    const e: Record<string, string> = {};
    if (!d.name.trim()) e.name = "Enter the official name.";
    else if (universities.some((u) => u.id !== d.id && u.name.trim().toLowerCase() === d.name.trim().toLowerCase())) e.name = "A university with this name already exists. Check for a duplicate before adding another.";
    if (d.cityIds.length === 0) e.cityIds = "Pick at least one campus city.";
    if (d.website && !URL_RE.test(d.website)) e.website = "Full web address starting with https://";
    if (d.admissionsUrl && !URL_RE.test(d.admissionsUrl)) e.admissionsUrl = "Full web address starting with https://";
    const anyRank = rk.organisation || rk.year || rk.position;
    const allRank = rk.organisation.trim() && /^\d{4}$/.test(rk.year) && /^\d+$/.test(rk.position);
    if (anyRank && !allRank) e.ranking = "A ranking needs all three: who published it, the year and the position. Never store an unexplained number.";
    if (d.status === "verified" && !d.source.url) e.status = "Add the official source before marking this verified.";
    if (editing.before && reason.trim().length < 5) e.reason = "Record what changed and why.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const next: University = {
      ...d, name: d.name.trim(), ranking: allRank ? { organisation: rk.organisation.trim(), year: Number(rk.year), position: Number(rk.position) } : undefined,
      source: { ...d.source, verification: d.status, ...(d.status === "verified" && editing.before?.status !== "verified" ? { lastCheckedAt: DEMO_NOW.slice(0, 10), checkedBy: admin.id } : {}) },
    };
    w.saveUniversity(editing.before, next, reason.trim() || undefined);
    setEditing(null);
  };

  const campusOptions = editing ? cities.filter((c) => c.countryCode === editing.draft.countryCode) : [];
  const programCount = (id: string) => programs.filter((p) => p.universityId === id).length;

  return (
    <div className="space-y-4">
      {!canEdit && <ReadOnlyNote perm="catalog.manage" />}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Input type="search" aria-label="Search universities" placeholder="Name or abbreviation" className="max-w-56" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select aria-label="Country" className="w-auto" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">All countries</option>{countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </Select>
        </div>
        <Button variant="primary" disabled={!canEdit} title={canEdit ? undefined : perm.why("catalog.manage")} onClick={() => open()}><Icon.Plus className="size-4" />Add university</Button>
      </div>
      <Section flush>
        {rows.length === 0 ? <Empty title="No universities match" /> : (
          <Table className="max-h-none">
            <colgroup><col className="w-[32%]" /><col className="w-[22%]" /><col className="w-[16%]" /><col className="w-[14%]" /><col className="w-[16%]" /></colgroup>
            <THead><TH>University</TH><TH>Campuses</TH><TH>Ranking</TH><TH>Programmes</TH><TH>Record</TH></THead>
            <tbody>
              {rows.map((u) => (
                <TR key={u.id}>
                  <TD>
                    <button type="button" className="text-left text-sm font-medium text-n-100 hover:underline" onClick={() => open(u)}>{u.name}</button>
                    <p className="text-n-500">{countries.find((c) => c.code === u.countryCode)?.name ?? u.countryCode}{u.type ? ` · ${u.type}` : " · type not recorded"}</p>
                  </TD>
                  <TD><div className="flex flex-wrap gap-1">{u.cityIds.map((id) => <Tag key={id}>{cities.find((c) => c.id === id)?.name ?? id}</Tag>)}</div></TD>
                  <TD className="text-n-300">{u.ranking ? <>#{u.ranking.position}<p className="text-n-500">{u.ranking.organisation} {u.ranking.year}</p></> : <span className="text-n-500">None stored</span>}</TD>
                  <TD className="tabular-nums text-n-300">{programCount(u.id)}</TD>
                  <TD><RecordStatusChip status={u.status} /><p className="mt-1 text-n-500 tabular-nums">{u.source.lastCheckedAt ? formatDate(u.source.lastCheckedAt) : "never checked"}</p></TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      {editing && (
        <Sheet open wide onClose={() => setEditing(null)} title={editing.before ? `Edit ${editing.before.name}` : "Add university"}
          footer={<><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button variant="primary" disabled={!canEdit} onClick={save}>Save</Button></>}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Official name" required error={errors.name}><Input data-autofocus value={editing.draft.name} onChange={(e) => set("name", e.target.value)} /></Field>
              <Field label="Other names or abbreviations" optional hint="Separate with commas."><Input value={editing.draft.abbreviations.join(", ")} onChange={(e) => set("abbreviations", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} /></Field>
              <Field label="Country" required><Select disabled={!!editing.before && programCount(editing.draft.id) > 0} value={editing.draft.countryCode} onChange={(e) => setEditing((x) => (x ? { ...x, draft: { ...x.draft, countryCode: e.target.value, cityIds: [] } } : x))}>
                {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</Select></Field>
              <Field label="Type"><Select value={editing.draft.type ?? ""} onChange={(e) => set("type", (e.target.value || null) as University["type"])}>
                <option value="">Not recorded</option><option value="public">Public</option><option value="private">Private</option></Select></Field>
              <Field label="Website" optional error={errors.website}><Input type="url" placeholder="https://" value={editing.draft.website ?? ""} onChange={(e) => set("website", e.target.value || null)} /></Field>
              <Field label="Admissions page" optional error={errors.admissionsUrl}><Input type="url" placeholder="https://" value={editing.draft.admissionsUrl ?? ""} onChange={(e) => set("admissionsUrl", e.target.value || null)} /></Field>
            </div>
            <fieldset>
              <legend className="mb-2 text-micro font-medium tracking-wide text-n-400 uppercase">Campuses <span className="normal-case tracking-normal text-n-500">Required</span></legend>
              {campusOptions.length === 0 ? <p className="text-tiny text-n-500">No cities in this country yet. Add one under Cities first.</p> : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {campusOptions.map((c) => <Checkbox key={c.id} label={c.name} checked={editing.draft.cityIds.includes(c.id)}
                    onChange={(e) => set("cityIds", e.target.checked ? [...editing.draft.cityIds, c.id] : editing.draft.cityIds.filter((x) => x !== c.id))} />)}
                </div>
              )}
              {errors.cityIds && <p className="mt-1 text-tiny text-bad-400">{errors.cityIds}</p>}
            </fieldset>
            <div className="rounded-md border border-line bg-raised p-4">
              <p className="text-sm font-medium text-n-100">Ranking <span className="text-tiny font-normal text-n-500">Optional, but all three or none</span></p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Published by"><Input value={editing.rank.organisation} onChange={(e) => setEditing((x) => (x ? { ...x, rank: { ...x.rank, organisation: e.target.value } } : x))} placeholder="QS World University Rankings" /></Field>
                <Field label="Year"><Input inputMode="numeric" value={editing.rank.year} onChange={(e) => setEditing((x) => (x ? { ...x, rank: { ...x.rank, year: e.target.value } } : x))} placeholder="2026" /></Field>
                <Field label="Position"><Input inputMode="numeric" value={editing.rank.position} onChange={(e) => setEditing((x) => (x ? { ...x, rank: { ...x.rank, position: e.target.value } } : x))} /></Field>
              </div>
              {errors.ranking && <p className="mt-2 text-tiny text-bad-400">{errors.ranking}</p>}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Official source" optional><Input type="url" placeholder="https://" value={editing.draft.source.url ?? ""} onChange={(e) => set("source", { ...editing.draft.source, url: e.target.value || null })} /></Field>
              <Field label="Record status" error={errors.status} hint="Archive instead of deleting: programmes and applications keep their links.">
                <Select value={editing.draft.status} onChange={(e) => set("status", e.target.value as RecordStatus)}>
                  {(Object.keys(RECORD_LABEL) as RecordStatus[]).map((s) => <option key={s} value={s}>{RECORD_LABEL[s]}</option>)}
                </Select>
              </Field>
            </div>
            {editing.draft.status === "archived" && programCount(editing.draft.id) > 0 && <Note tone="warn">{programCount(editing.draft.id)} programme{programCount(editing.draft.id) > 1 ? "s" : ""} still point to this university. They keep the link.</Note>}
            {editing.before && <Field label="What changed and why" required error={errors.reason}><Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>}
          </div>
        </Sheet>
      )}
    </div>
  );
}
