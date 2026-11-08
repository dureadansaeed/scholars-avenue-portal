"use client";

import { useState } from "react";
import { ReadOnlyNote, usePermissions, type AdminIdentity } from "@/components/admin/permissions";
import { Button } from "@/components/ui/button";
import { RecordStatusChip } from "@/components/ui/chips";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/overlays";
import { Empty, Note, Section } from "@/components/ui/panels";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { DEMO_NOW, formatDate } from "@/lib/clock";
import { newId } from "@/lib/use-local-state";
import type { City } from "@/types";
import { useCatalog, type CatalogData } from "../use-catalog";

function validTimezone(tz: string) {
  try { new Intl.DateTimeFormat("en-GB", { timeZone: tz }); return true; } catch { return false; }
}

export function CitiesView({ admin, data }: { admin: AdminIdentity; data: CatalogData }) {
  const { w, cities, countries, universities } = useCatalog(admin.id, data);
  const perm = usePermissions(admin);
  const canEdit = perm.can("catalog.manage");
  const [country, setCountry] = useState("");
  const [editing, setEditing] = useState<{ before: City | null; draft: City } | null>(null);
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const rows = cities.filter((c) => !country || c.countryCode === country).sort((a, b) => a.countryCode.localeCompare(b.countryCode) || a.name.localeCompare(b.name));
  const open = (c?: City) => {
    setEditing({ before: c ?? null, draft: structuredClone(c ?? { id: newId("city"), countryCode: country || "DE", name: "", timezone: "Europe/Berlin", source: { url: null, verification: "pending_review", lastCheckedAt: null } }) });
    setErrors({}); setReason("");
  };
  const set = <K extends keyof City>(k: K, v: City[K]) => setEditing((e) => (e ? { ...e, draft: { ...e.draft, [k]: v } } : e));

  const save = () => {
    if (!editing) return;
    const d = editing.draft;
    const e: Record<string, string> = {};
    if (!d.name.trim()) e.name = "Enter the city name.";
    else if (cities.some((c) => c.id !== d.id && c.countryCode === d.countryCode && c.name.toLowerCase() === d.name.trim().toLowerCase())) e.name = "This city already exists in that country.";
    if (!validTimezone(d.timezone)) e.timezone = "Use an IANA time zone, for example Europe/Berlin.";
    if (d.source.url && !/^https?:\/\/\S+$/.test(d.source.url)) e.source = "Full web address starting with https://";
    if (editing.before && reason.trim().length < 5) e.reason = "Record what changed and why.";
    setErrors(e);
    if (Object.keys(e).length) return;
    w.saveCity(editing.before, { ...d, name: d.name.trim() }, reason.trim() || undefined);
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      {!canEdit && <ReadOnlyNote perm="catalog.manage" />}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Select aria-label="Country" className="w-auto" value={country} onChange={(e) => setCountry(e.target.value)}>
          <option value="">All countries</option>{countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </Select>
        <Button variant="primary" disabled={!canEdit} title={canEdit ? undefined : perm.why("catalog.manage")} onClick={() => open()}><Icon.Plus className="size-4" />Add city</Button>
      </div>
      <Section flush>
        {rows.length === 0 ? <Empty title="No cities in this country yet" /> : (
          <Table className="max-h-none">
            <colgroup><col className="w-[24%]" /><col className="w-[20%]" /><col className="w-[20%]" /><col className="w-[36%]" /></colgroup>
            <THead><TH>City</TH><TH>Time zone</TH><TH>Campuses</TH><TH>Living information</TH></THead>
            <tbody>
              {rows.map((c) => (
                <TR key={c.id}>
                  <TD>
                    <button type="button" className="text-left text-sm font-medium text-n-100 hover:underline" onClick={() => open(c)}>{c.name}</button>
                    <p className="text-n-500">{countries.find((x) => x.code === c.countryCode)?.name ?? c.countryCode}{c.region ? ` · ${c.region}` : ""}</p>
                  </TD>
                  <TD className="text-n-300">{c.timezone}</TD>
                  <TD className="tabular-nums text-n-300">{universities.filter((u) => u.cityIds.includes(c.id)).length}</TD>
                  <TD>
                    <p className="line-clamp-2 text-n-300">{c.livingCostNote ?? <span className="text-n-500">Not recorded</span>}</p>
                    <div className="mt-1 flex items-center gap-2"><RecordStatusChip status={c.source.verification} /><span className="text-n-500 tabular-nums">{c.source.lastCheckedAt ? formatDate(c.source.lastCheckedAt) : "never checked"}</span></div>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      {editing && (
        <Sheet open onClose={() => setEditing(null)} title={editing.before ? `Edit ${editing.before.name}` : "Add city"}
          footer={<><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button variant="primary" disabled={!canEdit} onClick={save}>Save</Button></>}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="City" required error={errors.name}><Input data-autofocus value={editing.draft.name} onChange={(e) => set("name", e.target.value)} /></Field>
              <Field label="Country" required><Select value={editing.draft.countryCode} onChange={(e) => set("countryCode", e.target.value)}>{countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</Select></Field>
              <Field label="State or region" optional><Input value={editing.draft.region ?? ""} onChange={(e) => set("region", e.target.value || undefined)} /></Field>
              <Field label="Time zone" required error={errors.timezone} hint="Deadlines with a time use it."><Input value={editing.draft.timezone} onChange={(e) => set("timezone", e.target.value)} /></Field>
            </div>
            <Field label="Living information for students" optional hint="Cost of living, transport, housing. Guidance only, with the date you checked it.">
              <Textarea rows={3} value={editing.draft.livingCostNote ?? ""} onChange={(e) => set("livingCostNote", e.target.value || undefined)} />
            </Field>
            <Field label="Source" optional error={errors.source}><Input type="url" placeholder="https://" value={editing.draft.source.url ?? ""} onChange={(e) => set("source", { ...editing.draft.source, url: e.target.value || null })} /></Field>
            <div className="flex items-center gap-3">
              <Button size="sm" disabled={!editing.draft.source.url} onClick={() => set("source", { ...editing.draft.source, verification: "verified", lastCheckedAt: DEMO_NOW.slice(0, 10), checkedBy: admin.id })}>Checked today</Button>
              <span className="text-tiny text-n-500">{editing.draft.source.lastCheckedAt ? `Last checked ${formatDate(editing.draft.source.lastCheckedAt)}` : "Never checked"}</span>
            </div>
            {editing.before && <Field label="What changed and why" required error={errors.reason}><Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>}
            <Note>Students see living information with its date and a note that it is not a guaranteed cost.</Note>
          </div>
        </Sheet>
      )}
    </div>
  );
}
