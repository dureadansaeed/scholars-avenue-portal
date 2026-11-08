"use client";

import { useState } from "react";
import { ReadOnlyNote, usePermissions, type AdminIdentity } from "@/components/admin/permissions";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Disclosure } from "@/components/ui/navigation";
import { Note, Skeleton } from "@/components/ui/panels";
import { useAdminWork, type OrgSettings } from "@/lib/admin-work";
import { STATUS_LABEL } from "@/lib/application-rules";
import { newId } from "@/lib/use-local-state";
import type { ApplicationStatus } from "@/types";

const PLACEHOLDERS = ["{student}", "{counselor}", "{programme}", "{status}", "{document}", "{due_date}", "{deadline}", "{days}"];

/** One settings area: its own draft, its own Save, an audit entry per save. */
function Area<K extends keyof OrgSettings>({ k, title, description, value, canEdit, onSave, validate, children }: {
  k: K; title: string; description: string; value: OrgSettings[K]; canEdit: boolean;
  onSave: (k: K, before: OrgSettings[K], after: OrgSettings[K]) => void;
  validate?: (v: OrgSettings[K]) => string | null;
  children: (draft: OrgSettings[K], set: (v: OrgSettings[K]) => void) => React.ReactNode;
}) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(value);
  return (
    <Disclosure title={title} description={description}>
      <fieldset disabled={!canEdit} className="space-y-4">
        {children(draft, (v) => { setDraft(v); setSaved(false); setError(null); })}
      </fieldset>
      {error && <Note tone="bad" className="mt-3">{error}</Note>}
      <div className="mt-4 flex items-center gap-3">
        <Button variant="primary" size="sm" disabled={!canEdit || !dirty} onClick={() => {
          const problem = validate?.(draft) ?? null;
          if (problem) { setError(problem); return; }
          onSave(k, value, draft); setSaved(true);
        }}>Save</Button>
        {dirty && <Button size="sm" variant="ghost" onClick={() => { setDraft(value); setError(null); }}>Discard</Button>}
        {saved && !dirty && <span role="status" className="text-tiny text-ok-400">Saved and recorded in the audit log.</span>}
      </div>
    </Disclosure>
  );
}

export function SettingsView({ admin, defaults }: { admin: AdminIdentity; defaults: OrgSettings }) {
  const w = useAdminWork(admin.id);
  const perm = usePermissions(admin);
  const canEdit = perm.can("settings.manage");
  if (!w.ready) return <Skeleton className="h-96" />;
  const s: OrgSettings = { ...defaults, ...w.work.settings };
  const save = <K extends keyof OrgSettings>(k: K, before: OrgSettings[K], after: OrgSettings[K]) => w.saveSettings(k, before, after);

  return (
    <div className="space-y-4">
      {!canEdit && <ReadOnlyNote perm="settings.manage" />}
      <Note>In this demo, settings are kept in this browser and recorded in the audit log. The other screens still use the built-in values until a backend shares them.</Note>

      <Area k="statusLabels" title="Application statuses" description="What students see for each internal status. Internal names stay the same for reporting." value={s.statusLabels} canEdit={canEdit} onSave={save}
        validate={(v) => (Object.values(v).some((x) => !x.trim()) ? "Every status needs a student-facing label." : null)}>
        {(d, set) => (
          <div className="grid grid-cols-1 gap-x-6 gap-y-2 md:grid-cols-2">
            {(Object.keys(STATUS_LABEL) as ApplicationStatus[]).map((st) => (
              <label key={st} className="flex items-center justify-between gap-3 text-tiny">
                <span className="w-1/2 text-n-400">{STATUS_LABEL[st]}</span>
                <Input aria-label={`Student label for ${STATUS_LABEL[st]}`} className="w-1/2" value={d[st]} onChange={(e) => set({ ...d, [st]: e.target.value })} />
              </label>
            ))}
          </div>
        )}
      </Area>

      <Area k="packages" title="Packages" description="Service packages and their scope. Empty limits mean no limit." value={s.packages} canEdit={canEdit} onSave={save}
        validate={(v) => (v.some((p) => !p.name.trim()) ? "Every package needs a name." : v.some((p) => (p.maxApplications ?? 1) < 1 || (p.maxCountries ?? 1) < 1) ? "Limits must be 1 or more, or empty." : null)}>
        {(d, set) => (
          <>
            {d.map((p, i) => (
              <div key={p.id} className="flex flex-wrap items-end gap-3">
                <Field label="Name" className="w-48"><Input value={p.name} onChange={(e) => set(d.map((x, n) => (n === i ? { ...x, name: e.target.value } : x)))} /></Field>
                <Field label="Max applications" hint="Empty = no limit"><Input inputMode="numeric" className="w-28" value={p.maxApplications ?? ""} onChange={(e) => set(d.map((x, n) => (n === i ? { ...x, maxApplications: e.target.value === "" ? null : Number(e.target.value) } : x)))} /></Field>
                <Field label="Max countries" hint="Empty = no limit"><Input inputMode="numeric" className="w-28" value={p.maxCountries ?? ""} onChange={(e) => set(d.map((x, n) => (n === i ? { ...x, maxCountries: e.target.value === "" ? null : Number(e.target.value) } : x)))} /></Field>
              </div>
            ))}
            <Button size="sm" onClick={() => set([...d, { id: newId("pkg"), name: "", maxApplications: null, maxCountries: null }])}><Icon.Plus className="size-3.5" />Add package</Button>
            <p className="text-tiny text-n-500">Packages already sold keep their scope; there is no delete here.</p>
          </>
        )}
      </Area>

      <Area k="documentCategories" title="Document categories" description="Names students and staff see for each kind of document." value={s.documentCategories} canEdit={canEdit} onSave={save}
        validate={(v) => (Object.values(v).some((x) => !x.trim()) ? "Every category needs a name." : null)}>
        {(d, set) => (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {Object.entries(d).map(([k, v]) => <Input key={k} aria-label={`Name for ${k}`} value={v} onChange={(e) => set({ ...d, [k]: e.target.value })} />)}
          </div>
        )}
      </Area>

      <Area k="degreeLevels" title="Degree levels" description="Levels offered in student preferences and the catalog." value={s.degreeLevels} canEdit={canEdit} onSave={save}
        validate={(v) => (!v.some((x) => x.enabled) ? "Keep at least one degree level enabled." : null)}>
        {(d, set) => d.map((l, i) => (
          <div key={l.key} className="flex items-center gap-4">
            <Input aria-label={`Label for ${l.key}`} className="max-w-56" value={l.label} onChange={(e) => set(d.map((x, n) => (n === i ? { ...x, label: e.target.value } : x)))} />
            <Checkbox label="Offered" checked={l.enabled} onChange={(e) => set(d.map((x, n) => (n === i ? { ...x, enabled: e.target.checked } : x)))} />
          </div>
        ))}
      </Area>

      <Area k="languages" title="Communication languages" description="Languages students can choose for communication." value={s.languages} canEdit={canEdit} onSave={save}
        validate={(v) => (v.length === 0 ? "Add at least one language." : null)}>
        {(d, set) => <Field label="Languages" hint="Separate with commas."><Input value={d.join(", ")} onChange={(e) => set(e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} /></Field>}
      </Area>

      <Area k="routes" title="Application routes" description="Names for the ways applications are submitted." value={s.routes} canEdit={canEdit} onSave={save}
        validate={(v) => (Object.values(v).some((x) => !x.trim()) ? "Every route needs a name." : null)}>
        {(d, set) => (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {Object.entries(d).map(([k, v]) => <Input key={k} aria-label={`Name for route ${k}`} value={v} onChange={(e) => set({ ...d, [k]: e.target.value })} />)}
          </div>
        )}
      </Area>

      <Area k="templates" title="Notification templates" description={`In-app and, later, email wording. Placeholders: ${PLACEHOLDERS.join(" ")}`} value={s.templates} canEdit={canEdit} onSave={save}
        validate={(v) => {
          const bad = v.flatMap((t) => [...`${t.subject} ${t.body}`.matchAll(/\{[a-z_]+\}/g)].map((m) => m[0])).filter((p) => !PLACEHOLDERS.includes(p));
          if (bad.length) return `Unknown placeholder${bad.length > 1 ? "s" : ""}: ${[...new Set(bad)].join(", ")}.`;
          return v.some((t) => !t.subject.trim() || !t.body.trim()) ? "Every template needs a subject and a body." : null;
        }}>
        {(d, set) => d.map((t, i) => (
          <div key={t.key} className="space-y-2 rounded-md border border-line p-3">
            <p className="text-sm font-medium text-n-100">{t.label}</p>
            <Field label="Subject"><Input value={t.subject} onChange={(e) => set(d.map((x, n) => (n === i ? { ...x, subject: e.target.value } : x)))} /></Field>
            <Field label="Message"><Textarea rows={2} value={t.body} onChange={(e) => set(d.map((x, n) => (n === i ? { ...x, body: e.target.value } : x)))} /></Field>
          </div>
        ))}
      </Area>

      <Area k="reminderDays" title="Deadline reminders" description="How many days before a deadline people are reminded." value={s.reminderDays} canEdit={canEdit} onSave={save}
        validate={(v) => (v.length === 0 || v.some((x) => !Number.isInteger(x) || x < 1 || x > 365) ? "Whole numbers of days, 1 to 365, separated by commas." : null)}>
        {(d, set) => (
          <Field label="Days before" hint="For example 30, 14, 7, 3, 1. The same event is never sent twice.">
            <Input value={d.join(", ")} onChange={(e) => set([...new Set(e.target.value.split(",").map((x) => Number(x.trim())).filter((x) => x !== 0 && !Number.isNaN(x)))].sort((a, b) => b - a))} />
          </Field>
        )}
      </Area>

      <Area k="workloadThreshold" title="Default workload limit" description="Active cases a new counselor can hold before assignments warn. Each counselor can have their own." value={s.workloadThreshold} canEdit={canEdit} onSave={save}
        validate={(v) => (!Number.isInteger(v) || v < 1 || v > 200 ? "A whole number from 1 to 200." : null)}>
        {(d, set) => <Field label="Active cases" className="max-w-40"><Input inputMode="numeric" value={Number.isNaN(d) ? "" : d} onChange={(e) => set(Number(e.target.value))} /></Field>}
      </Area>

      <Area k="reviewIntervalDays" title="Catalog review interval" description="After this many days a verified programme is flagged as stale." value={s.reviewIntervalDays} canEdit={canEdit} onSave={save}
        validate={(v) => (!Number.isInteger(v) || v < 30 || v > 730 ? "A whole number of days from 30 to 730." : null)}>
        {(d, set) => <Field label="Days" className="max-w-40"><Input inputMode="numeric" value={Number.isNaN(d) ? "" : d} onChange={(e) => set(Number(e.target.value))} /></Field>}
      </Area>
    </div>
  );
}
