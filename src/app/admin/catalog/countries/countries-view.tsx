"use client";

import { useState } from "react";
import { ReadOnlyNote, usePermissions, type AdminIdentity } from "@/components/admin/permissions";
import { Button } from "@/components/ui/button";
import { Status, Tag } from "@/components/ui/chips";
import { Checkbox, Field, Input, Switch, Textarea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/overlays";
import { Empty, Note, Section } from "@/components/ui/panels";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { DEMO_NOW, formatDate } from "@/lib/clock";
import { ROUTE_LABEL } from "@/lib/student-labels";
import type { ApplicationRouteType, Country } from "@/types";
import { useCatalog, type CatalogData } from "../use-catalog";

const blank = (): Country => ({ code: "", name: "", region: "Europe", currency: "EUR", active: true, intakeLabels: [], routes: [], catalogProgress: { programs: 0, verified: 0 } });

export function CountriesView({ admin, data }: { admin: AdminIdentity; data: CatalogData }) {
  const { w, countries } = useCatalog(admin.id, data);
  const perm = usePermissions(admin);
  const canEdit = perm.can("catalog.manage");
  const [editing, setEditing] = useState<{ before: Country | null; draft: Country } | null>(null);
  const [toggling, setToggling] = useState<Country | null>(null);
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const open = (c?: Country) => { setEditing({ before: c ?? null, draft: structuredClone(c ?? blank()) }); setErrors({}); setReason(""); };
  const set = <K extends keyof Country>(k: K, v: Country[K]) => setEditing((e) => (e ? { ...e, draft: { ...e.draft, [k]: v } } : e));

  const save = () => {
    if (!editing) return;
    const d = editing.draft;
    const e: Record<string, string> = {};
    if (!/^[A-Z]{2}$/.test(d.code)) e.code = "Two capital letters, the ISO 3166 code (for example DE).";
    else if (!editing.before && countries.some((c) => c.code === d.code)) e.code = "This country already exists.";
    if (!d.name.trim()) e.name = "Enter the official name.";
    if (!/^[A-Z]{3}$/.test(d.currency)) e.currency = "Three capital letters (ISO 4217), for example EUR.";
    if (d.source?.url && !/^https?:\/\/\S+$/.test(d.source.url)) e.source = "Full web address starting with https://";
    if (editing.before && reason.trim().length < 5) e.reason = "Record what changed and why.";
    setErrors(e);
    if (Object.keys(e).length) return;
    w.saveCountry(editing.before, { ...d, name: d.name.trim() }, reason.trim() || undefined);
    setEditing(null);
  };
  const confirmToggle = () => {
    if (!toggling || reason.trim().length < 5) { setErrors({ toggle: "Record why." }); return; }
    w.saveCountry(toggling, { ...toggling, active: !toggling.active }, reason.trim());
    setToggling(null);
  };

  return (
    <div className="space-y-4">
      {!canEdit && <ReadOnlyNote perm="catalog.manage" />}
      <div className="flex justify-end">
        <Button variant="primary" disabled={!canEdit} title={canEdit ? undefined : perm.why("catalog.manage")} onClick={() => open()}><Icon.Plus className="size-4" />Add country</Button>
      </div>
      <Section flush>
        {countries.length === 0 ? <Empty title="No countries" /> : (
          <Table className="max-h-none">
            <colgroup><col className="w-[24%]" /><col className="w-[14%]" /><col className="w-[28%]" /><col className="w-[18%]" /><col className="w-[16%]" /></colgroup>
            <THead><TH>Country</TH><TH>Currency</TH><TH>Routes and intakes</TH><TH>Catalog</TH><TH>Enabled</TH></THead>
            <tbody>
              {countries.map((c) => (
                <TR key={c.code}>
                  <TD>
                    <button type="button" className="text-left text-sm font-medium text-n-100 hover:underline" onClick={() => open(c)}>{c.name}</button>
                    <p className="text-n-500">{c.code} · {c.region}</p>
                  </TD>
                  <TD className="tabular-nums text-n-300">{c.currency}</TD>
                  <TD>
                    <div className="flex flex-wrap gap-1">{c.routes.map((r) => <Tag key={r}>{ROUTE_LABEL[r]}</Tag>)}</div>
                    <p className="mt-1 text-n-500">{c.intakeLabels.length ? c.intakeLabels.join(", ") : "No intake labels"}</p>
                  </TD>
                  <TD className="tabular-nums text-n-300">{c.catalogProgress.programs} programmes<p className="text-n-500">{c.catalogProgress.verified} verified</p></TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <Switch label={`${c.name} enabled`} checked={c.active} disabled={!canEdit} onChange={() => { setToggling(c); setReason(""); setErrors({}); }} />
                      {!c.active && <Status tone="neutral">Off</Status>}
                    </div>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </Section>
      <p className="text-tiny text-n-500">A country can be enabled for student preferences and search before its catalog is populated. Turning one off keeps every case, application and programme in it.</p>

      {editing && (
        <Sheet open wide onClose={() => setEditing(null)} title={editing.before ? `Edit ${editing.before.name}` : "Add country"}
          description="Country-wide guidance only. A university, programme or intake rule always wins over these defaults."
          footer={<><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button variant="primary" disabled={!canEdit} onClick={save}>Save</Button></>}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <Field label="ISO code" required error={errors.code}><Input data-autofocus disabled={!!editing.before} value={editing.draft.code} onChange={(e) => set("code", e.target.value.toUpperCase().slice(0, 2))} /></Field>
              <Field label="Official name" required error={errors.name} className="sm:col-span-2"><Input value={editing.draft.name} onChange={(e) => set("name", e.target.value)} /></Field>
              <Field label="Currency" required error={errors.currency}><Input value={editing.draft.currency} onChange={(e) => set("currency", e.target.value.toUpperCase().slice(0, 3))} /></Field>
              <Field label="Region" className="sm:col-span-2"><Input value={editing.draft.region} onChange={(e) => set("region", e.target.value)} /></Field>
              <Field label="Intake labels" hint="Separate with commas." className="sm:col-span-2"><Input value={editing.draft.intakeLabels.join(", ")} onChange={(e) => set("intakeLabels", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} /></Field>
            </div>
            <fieldset>
              <legend className="mb-2 text-micro font-medium tracking-wide text-n-400 uppercase">Application routes used in this country</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {(Object.keys(ROUTE_LABEL) as ApplicationRouteType[]).map((r) => (
                  <Checkbox key={r} label={ROUTE_LABEL[r]} checked={editing.draft.routes.includes(r)} onChange={(e) => set("routes", e.target.checked ? [...editing.draft.routes, r] : editing.draft.routes.filter((x) => x !== r))} />
                ))}
              </div>
            </fieldset>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Grading and qualifications" optional hint="Grade scales, conversion methods, accepted prior education."><Textarea rows={3} value={editing.draft.gradingNote ?? ""} onChange={(e) => set("gradingNote", e.target.value || undefined)} /></Field>
              <Field label="Language rules" optional hint="Accepted tests, alternative evidence and its conditions."><Textarea rows={3} value={editing.draft.languageNote ?? ""} onChange={(e) => set("languageNote", e.target.value || undefined)} /></Field>
              <Field label="Application process" optional hint="Central portals, VPD, aptitude tests, interviews."><Textarea rows={3} value={editing.draft.processNote ?? ""} onChange={(e) => set("processNote", e.target.value || undefined)} /></Field>
              <Field label="Documents and translation" optional hint="Certification, legalisation, accepted formats."><Textarea rows={3} value={editing.draft.documentNote ?? ""} onChange={(e) => set("documentNote", e.target.value || undefined)} /></Field>
              <Field label="Fees" optional hint="Typical fees and semester charges, with the date they apply from."><Textarea rows={3} value={editing.draft.feeNote ?? ""} onChange={(e) => set("feeNote", e.target.value || undefined)} /></Field>
              <div className="space-y-4">
                <Field label="Authoritative source" optional error={errors.source}><Input type="url" placeholder="https://" value={editing.draft.source?.url ?? ""}
                  onChange={(e) => set("source", { url: e.target.value || null, verification: editing.draft.source?.verification ?? "pending_review", lastCheckedAt: editing.draft.source?.lastCheckedAt ?? null })} /></Field>
                <div className="flex items-center gap-3">
                  <Button size="sm" disabled={!editing.draft.source?.url} onClick={() => set("source", { ...editing.draft.source!, verification: "verified", lastCheckedAt: DEMO_NOW.slice(0, 10), checkedBy: admin.id })}>Checked today</Button>
                  <span className="text-tiny text-n-500">{editing.draft.source?.lastCheckedAt ? `Last checked ${formatDate(editing.draft.source.lastCheckedAt)}` : "Never checked"}</span>
                </div>
              </div>
            </div>
            {editing.before && <Field label="What changed and why" required error={errors.reason}><Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>}
            <Note>Unknown stays unknown: leave a field empty rather than guessing. Counselors see empty guidance as “not recorded”.</Note>
          </div>
        </Sheet>
      )}

      <Sheet open={!!toggling} onClose={() => setToggling(null)} title={toggling?.active ? `Turn off ${toggling?.name}` : `Turn on ${toggling?.name}`}
        description={toggling?.active ? "Students can no longer choose it and it drops out of search. Existing cases, applications and programmes are kept." : "It becomes available in student preferences and counselor search."}
        footer={<><Button variant="ghost" onClick={() => setToggling(null)}>Cancel</Button><Button variant="primary" onClick={confirmToggle}>{toggling?.active ? "Turn off" : "Turn on"}</Button></>}>
        <Field label="Reason" required error={errors.toggle}><Textarea data-autofocus rows={2} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      </Sheet>
    </div>
  );
}
