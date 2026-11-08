"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ReadOnlyNote, usePermissions, type AdminIdentity } from "@/components/admin/permissions";
import { Button } from "@/components/ui/button";
import { buttonClass } from "@/components/ui/button-styles";
import { RecordStatusChip, SampleTag, Status, Tag } from "@/components/ui/chips";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Segmented } from "@/components/ui/navigation";
import { Sheet } from "@/components/ui/overlays";
import { Empty, Note, Section, Skeleton } from "@/components/ui/panels";
import { checkRecordMove, isStale, RECORD_ACTION, RECORD_LABEL, RECORD_NEEDS_REASON, RECORD_NEXT, REVIEW_INTERVAL_DAYS, validateProgram } from "@/lib/catalog-rules";
import { DEMO_NOW, formatDate } from "@/lib/clock";
import { cx } from "@/lib/cx";
import { ROUTE_LABEL } from "@/lib/student-labels";
import { newId } from "@/lib/use-local-state";
import type {
  ApplicationRouteType, DegreeLevel, LanguageRequirement, LanguageTestType, OtherTestType, Program, ProgramIntake,
  QualificationLevel, RecordStatus, Req,
} from "@/types";
import { useCatalog, type CatalogData } from "../../use-catalog";

type ReqStatus = Req<unknown>["status"];
const TEST_LABEL: Record<LanguageTestType, string> = {
  ielts_academic: "IELTS Academic", ielts_general: "IELTS General", toefl_ibt: "TOEFL iBT", pte_academic: "PTE Academic",
  cambridge: "Cambridge English", duolingo: "Duolingo English Test", testdaf: "TestDaF", goethe: "Goethe-Zertifikat", other: "Other",
};
const OTHER_TESTS: OtherTestType[] = ["gre", "gmat", "sat", "act", "testas", "german_cefr", "other"];
const LEVELS: Record<QualificationLevel, string> = { higher_secondary: "Higher secondary", bachelor: "Bachelor's", master: "Master's", phd: "PhD" };
const COMPONENTS = ["listening", "reading", "writing", "speaking"] as const;

function blankProgram(): Program {
  return {
    id: newId("prg"), universityId: "", countryCode: "", cityId: "", name: "", degreeLevel: "master", degreeTitle: "", subject: "", tags: [],
    languageOfInstruction: ["English"], studyMode: "full_time", durationMonths: null, intakes: [],
    requirements: { previousQualification: { status: "unknown" }, minGrade: { status: "unknown" }, languageTests: { status: "unknown" }, otherTests: { status: "unknown" }, workExperienceMonths: { status: "unknown" } },
    scholarshipAvailable: null, status: "draft", source: { url: null, verification: "draft", lastCheckedAt: null }, sample: true,
  };
}
function blankIntake(): ProgramIntake {
  return { id: newId("int"), name: "", year: 2027, opensOn: null, deadline: { kind: "not_published" }, route: null, applicationFee: null, tuition: null };
}

/** A number field that keeps what you type ("3.") and reports a number, or null when empty (unknown). */
function NumberInput({ value, onChange, ...rest }: { value: number | null | undefined; onChange: (n: number | null) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const [text, setText] = useState(value == null ? "" : String(value));
  return <Input inputMode="decimal" value={text} {...rest} onChange={(e) => {
    const t = e.target.value; setText(t);
    if (t.trim() === "") onChange(null); else if (!Number.isNaN(Number(t))) onChange(Number(t));
  }} />;
}

/** Required / Not required / Unknown. Unknown is a real answer and is never turned into "none" (PRD 7.6.4). */
function TriState({ label, value, onChange, disabled }: { label: string; value: ReqStatus; onChange: (v: ReqStatus) => void; disabled?: boolean }) {
  return (
    <div className={cx(disabled && "pointer-events-none opacity-60")}>
      <Segmented label={label} size="sm" value={value} onChange={onChange}
        options={[{ value: "required", label: "Required" }, { value: "not_required", label: "Not required" }, { value: "unknown", label: "Unknown" }]} />
    </div>
  );
}

export function ProgramEditor({ admin, id, data }: { admin: AdminIdentity; id: string; data: CatalogData }) {
  const router = useRouter();
  const { w, programs, universities, cities, countries, linked, nameOf } = useCatalog(admin.id, data);
  const perm = usePermissions(admin);
  const canEdit = perm.can("catalog.manage");
  const isNew = id === "new";
  const saved = isNew ? null : programs.find((p) => p.id === id) ?? null;

  const [draft, setDraft] = useState<Program>(() => structuredClone(saved ?? blankProgram()));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string>();
  const [moving, setMoving] = useState<RecordStatus | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // Edits saved in this browser load after hydration; start the form from them once they are in.
  const [synced, setSynced] = useState(false);
  if (w.ready && !synced) {
    setSynced(true);
    if (saved) setDraft(structuredClone(saved));
  }

  if (!w.ready) return <Skeleton className="h-96" />;
  if (!isNew && !saved) {
    return <Section><Empty title="No such programme" action={<Link href="/admin/catalog" className={buttonClass("secondary", "sm")}>Back to the catalog</Link>}>
      It may have been created in another browser. In this demo, new records live in the browser that created them.</Empty></Section>;
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved ?? blankProgram()) && (!isNew || draft.name.trim() !== "" || draft.universityId !== "");
  const set = <K extends keyof Program>(k: K, v: Program[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const setReq = <K extends keyof Program["requirements"]>(k: K, v: Program["requirements"][K]) => setDraft((d) => ({ ...d, requirements: { ...d.requirements, [k]: v } }));
  const setIntake = (i: number, patch: Partial<ProgramIntake>) => setDraft((d) => ({ ...d, intakes: d.intakes.map((x, n) => (n === i ? { ...x, ...patch } : x)) }));
  const ro = !canEdit;
  const uni = universities.find((u) => u.id === draft.universityId);
  const country = countries.find((c) => c.code === (uni?.countryCode ?? draft.countryCode));
  const cityOptions = cities.filter((c) => (uni ? uni.cityIds.includes(c.id) || c.countryCode === uni.countryCode : true));
  const r = draft.requirements;
  const linkedApps = saved ? linked[saved.id] ?? 0 : 0;
  const history = w.work.audit.filter((e) => e.recordType === "program" && e.recordId === draft.id);

  const startSave = () => {
    const e = validateProgram(draft);
    setErrors(e);
    if (Object.keys(e).length) { setToast(null); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    setReason(""); setReasonError(undefined); setSaving(true);
  };
  const confirmSave = () => {
    if (saved && reason.trim().length < 5) { setReasonError("Record what changed and why. Corrections keep the editor and the reason (PRD 13.15)."); return; }
    let next: Program = { ...draft, countryCode: uni?.countryCode ?? draft.countryCode };
    // Changing a verified record sends it back for review: edited facts are not verified facts.
    if (saved?.status === "verified") next = { ...next, status: "pending_review", source: { ...next.source, verification: "pending_review" } };
    w.saveProgram(saved, next, reason.trim() || undefined);
    setSaving(false);
    setDraft(next);
    setToast(saved?.status === "verified" ? "Saved. Because it was verified, the record is now pending review until someone checks it against the source again." : "Saved.");
    if (isNew) router.replace(`/admin/catalog/programs/${next.id}`);
  };
  const confirmMove = () => {
    if (!saved || !moving) return;
    const problem = checkRecordMove(saved, moving, reason);
    if (problem) { setReasonError(problem); return; }
    const verifiedNow = moving === "verified";
    const next: Program = {
      ...saved, status: moving,
      source: { ...saved.source, verification: moving, ...(verifiedNow ? { lastCheckedAt: DEMO_NOW.slice(0, 10), checkedBy: admin.id } : {}) },
    };
    w.saveProgram(saved, next, reason.trim() || undefined, "program.status_changed");
    setDraft(structuredClone(next)); setMoving(null);
    setToast(`Record is now ${RECORD_LABEL[moving].toLowerCase()}.`);
  };

  const errorList = Object.values(errors);
  const lang = r.languageTests;

  return (
    <div className="space-y-4">
      <nav aria-label="Breadcrumb" className="text-tiny text-n-500"><Link href="/admin/catalog" className="hover:text-n-100">Programme catalog</Link> <span aria-hidden>/</span> {isNew ? "New programme" : `${saved!.degreeTitle} ${saved!.name}`}</nav>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-n-100">{isNew ? "New programme" : `${draft.degreeTitle} ${draft.name}`}</h1>
          <p className="mt-1 text-base text-n-400">{uni ? `${uni.name}${country ? `, ${country.name}` : ""}` : "Choose a university below"}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <RecordStatusChip status={saved?.status ?? "draft"} />{saved && isStale(saved) && <Status tone="warn">Stale: last checked over {REVIEW_INTERVAL_DAYS} days ago</Status>}<SampleTag />
            {saved && <span className="text-tiny tabular-nums text-n-500">{saved.source.lastCheckedAt ? `Checked ${formatDate(saved.source.lastCheckedAt)}${saved.source.checkedBy ? ` by ${nameOf(saved.source.checkedBy)}` : ""}` : "Never checked against a source"}</span>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {dirty && <span className="text-tiny text-warn-400">Unsaved changes</span>}
          <Button variant="primary" disabled={ro || !dirty} title={ro ? perm.why("catalog.manage") : undefined} onClick={startSave}>{isNew ? "Create programme" : "Save changes"}</Button>
        </div>
      </header>

      {ro && <ReadOnlyNote perm="catalog.manage" />}
      {toast && <Note tone="ok" action={<button type="button" className="text-tiny opacity-60 hover:opacity-100" onClick={() => setToast(null)}>Dismiss</button>}>{toast}</Note>}
      {errorList.length > 0 && <Note tone="bad" title="Not saved. Please fix these:"><ul className="list-disc pl-4">{errorList.map((e) => <li key={e}>{e}</li>)}</ul></Note>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Section title="Programme" description="Identity and classification.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Official name" required error={errors.name}><Input disabled={ro} value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="Computer Science" /></Field>
              <Field label="Degree title" required error={errors.degreeTitle}><Input disabled={ro} value={draft.degreeTitle} onChange={(e) => set("degreeTitle", e.target.value)} placeholder="MSc" /></Field>
              <Field label="Degree level" required>
                <Select disabled={ro} value={draft.degreeLevel} onChange={(e) => set("degreeLevel", e.target.value as DegreeLevel)}>
                  <option value="bachelor">Bachelor&apos;s</option><option value="master">Master&apos;s</option><option value="phd">PhD</option><option value="other">Other</option>
                </Select>
              </Field>
              <Field label="Subject area" required><Input disabled={ro} value={draft.subject} onChange={(e) => set("subject", e.target.value)} /></Field>
              <Field label="University" required error={errors.universityId}>
                <Select disabled={ro} value={draft.universityId} onChange={(e) => { const u = universities.find((x) => x.id === e.target.value); setDraft((d) => ({ ...d, universityId: e.target.value, countryCode: u?.countryCode ?? "", cityId: u?.cityIds[0] ?? "" })); }}>
                  <option value="">Choose…</option>{universities.filter((u) => u.status !== "archived" || u.id === draft.universityId).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </Select>
              </Field>
              <Field label="Campus city" required error={errors.cityId}>
                <Select disabled={ro || !uni} value={draft.cityId} onChange={(e) => set("cityId", e.target.value)}>
                  <option value="">Choose…</option>{cityOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
              <Field label="Languages of instruction" hint="Separate with commas."><Input disabled={ro} value={draft.languageOfInstruction.join(", ")} onChange={(e) => set("languageOfInstruction", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} /></Field>
              <Field label="Duration (months)" optional error={errors.durationMonths} hint="Leave empty if not known."><NumberInput disabled={ro} value={draft.durationMonths} onChange={(n) => set("durationMonths", n)} /></Field>
              <Field label="Study mode"><Select disabled={ro} value={draft.studyMode} onChange={(e) => set("studyMode", e.target.value as Program["studyMode"])}><option value="full_time">Full-time</option><option value="part_time">Part-time</option></Select></Field>
              <Field label="Tags" optional hint="Separate with commas."><Input disabled={ro} value={draft.tags.join(", ")} onChange={(e) => set("tags", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} /></Field>
            </div>
          </Section>

          <Section title="Academic requirements" description="Unknown means not yet confirmed. It is shown to counselors as unknown, never as “no requirement”.">
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-sm font-medium text-n-100">Previous qualification</p>
                <TriState label="Previous qualification" disabled={ro} value={r.previousQualification.status} onChange={(s) => setReq("previousQualification", s === "required" ? { status: s, value: "bachelor" } : { status: s })} />
                {r.previousQualification.status === "required" && (
                  <Select disabled={ro} aria-label="Required qualification" className="w-56" value={r.previousQualification.value} onChange={(e) => setReq("previousQualification", { status: "required", value: e.target.value as QualificationLevel })}>
                    {Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-n-100">Minimum grade</p>
                <TriState label="Minimum grade" disabled={ro} value={r.minGrade.status} onChange={(s) => setReq("minGrade", s === "required" ? { status: s, value: { value: 0, scale: 0 } } : { status: s })} />
                {r.minGrade.status === "required" && (
                  <div className="grid max-w-md grid-cols-2 gap-3">
                    <Field label="Minimum" required error={errors.minGrade}><NumberInput disabled={ro} value={r.minGrade.value.value || null} onChange={(n) => setReq("minGrade", { status: "required", value: { value: n ?? 0, scale: (r.minGrade as { value: { scale: number } }).value.scale } })} placeholder="3.0" /></Field>
                    <Field label="Out of (scale)" required error={errors.minGradeScale} hint="Stored separately. Never assumed."><NumberInput disabled={ro} value={r.minGrade.value.scale || null} onChange={(n) => setReq("minGrade", { status: "required", value: { value: (r.minGrade as { value: { value: number } }).value.value, scale: n ?? 0 } })} placeholder="4.0" /></Field>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-n-100">Other tests</p>
                <TriState label="Other tests" disabled={ro} value={r.otherTests.status} onChange={(s) => setReq("otherTests", s === "required" ? { status: s, value: [] } : { status: s })} />
                {r.otherTests.status === "required" && (
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {OTHER_TESTS.map((t) => {
                      const list = (r.otherTests as { value: OtherTestType[] }).value;
                      return <Checkbox key={t} disabled={ro} label={t.toUpperCase().replace("_", " ")} checked={list.includes(t)}
                        onChange={(e) => setReq("otherTests", { status: "required", value: e.target.checked ? [...list, t] : list.filter((x) => x !== t) })} />;
                    })}
                  </div>
                )}
                {errors.otherTests && <p className="text-tiny text-bad-400">{errors.otherTests}</p>}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-n-100">Work experience</p>
                <TriState label="Work experience" disabled={ro} value={r.workExperienceMonths.status} onChange={(s) => setReq("workExperienceMonths", s === "required" ? { status: s, value: 12 } : { status: s })} />
                {r.workExperienceMonths.status === "required" && (
                  <Field label="Months" required error={errors.workExperience} className="max-w-40"><NumberInput disabled={ro} value={r.workExperienceMonths.value} onChange={(n) => setReq("workExperienceMonths", { status: "required", value: n ?? 0 })} /></Field>
                )}
              </div>
            </div>
          </Section>

          <Section title="Language requirements" description="One row per accepted test, with its own minimums. Tests are never converted into each other.">
            <div className="space-y-4">
              <TriState label="Language requirement" disabled={ro} value={lang.status} onChange={(s) => setReq("languageTests", s === "required" ? { status: s, value: [{ testType: "ielts_academic", overall: null, components: {} }] } : { status: s })} />
              {lang.status === "unknown" && <Note tone="warn">Shown to counselors as incomplete, not as language-unrestricted (PRD 13.12).</Note>}
              {lang.status === "required" && (
                <>
                  {lang.value.map((t, i) => {
                    const update = (patch: Partial<LanguageRequirement>) => setReq("languageTests", { status: "required", value: lang.value.map((x, n) => (n === i ? { ...x, ...patch } : x)) });
                    return (
                      <div key={i} className="rounded-md border border-line bg-raised p-3">
                        <div className="flex flex-wrap items-end gap-3">
                          <Field label="Test"><Select disabled={ro} className="w-48" value={t.testType} onChange={(e) => update({ testType: e.target.value as LanguageTestType })}>
                            {Object.entries(TEST_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
                          <Field label="Overall minimum" hint="Empty = not recorded"><NumberInput disabled={ro} className="w-28" value={t.overall} onChange={(n) => update({ overall: n })} /></Field>
                          {COMPONENTS.map((c) => (
                            <Field key={c} label={c[0].toUpperCase() + c.slice(1)}><NumberInput disabled={ro} className="w-20" value={t.components[c] ?? null}
                              onChange={(n) => { const comps = { ...t.components }; if (n == null) delete comps[c]; else comps[c] = n; update({ components: comps }); }} /></Field>
                          ))}
                          {!ro && <Button size="sm" variant="ghost" aria-label={`Remove ${TEST_LABEL[t.testType]}`} onClick={() => setReq("languageTests", { status: "required", value: lang.value.filter((_, n) => n !== i) })}><Icon.X className="size-3.5" /></Button>}
                        </div>
                        {errors[`lang${i}`] && <p className="mt-1 text-tiny text-bad-400">{errors[`lang${i}`]}</p>}
                      </div>
                    );
                  })}
                  {errors.languageTests && <p className="text-tiny text-bad-400">{errors.languageTests}</p>}
                  {!ro && <Button size="sm" onClick={() => setReq("languageTests", { status: "required", value: [...lang.value, { testType: "toefl_ibt", overall: null, components: {} }] })}><Icon.Plus className="size-3.5" />Add accepted test</Button>}
                </>
              )}
            </div>
          </Section>

          <Section title="Intakes" description="Deadlines, route and fees belong to an intake, because they change from year to year." flush
            actions={!ro ? <Button size="sm" onClick={() => setDraft((d) => ({ ...d, intakes: [...d.intakes, blankIntake()] }))}><Icon.Plus className="size-3.5" />Add intake</Button> : undefined}>
            {draft.intakes.length === 0 ? <Empty title="No intakes yet">{errors.intakes ?? "Add the intake students apply for."}</Empty> : (
              <ul className="divide-y divide-line">
                {draft.intakes.map((it, i) => {
                  const existing = saved?.intakes.some((x) => x.id === it.id);
                  const lockRemove = existing && linkedApps > 0;
                  const d = it.deadline;
                  return (
                    <li key={it.id} className="space-y-3 px-5 py-4">
                      <div className="flex flex-wrap items-end gap-3">
                        <Field label="Intake name" required><Input disabled={ro} className="w-44" value={it.name} onChange={(e) => setIntake(i, { name: e.target.value })} placeholder="Winter 2027" /></Field>
                        <Field label="Year"><NumberInput disabled={ro} className="w-24" value={it.year} onChange={(n) => setIntake(i, { year: n ?? it.year })} /></Field>
                        <Field label="Applications open" optional><Input disabled={ro} type="date" className="w-40" value={it.opensOn ?? ""} onChange={(e) => setIntake(i, { opensOn: e.target.value || null })} /></Field>
                        {!ro && <Button size="sm" variant="ghost" className="ml-auto" disabled={lockRemove}
                          title={lockRemove ? "Applications link to this programme. Keep the intake; archive the programme instead if it has closed." : undefined}
                          onClick={() => setDraft((x) => ({ ...x, intakes: x.intakes.filter((_, n) => n !== i) }))}>Remove intake</Button>}
                      </div>
                      <div className="space-y-2">
                        <p className="text-micro font-medium tracking-wide text-n-400 uppercase">Deadline</p>
                        <div className={cx(ro && "pointer-events-none opacity-60")}>
                          <Segmented label="Deadline type" size="sm" value={d.kind} onChange={(k) => setIntake(i, { deadline: k === "fixed" ? { kind: "fixed", date: "", type: "university", dateOnly: true } : { kind: k } })}
                            options={[{ value: "fixed", label: "Fixed date" }, { value: "rolling", label: "Rolling" }, { value: "not_published", label: "Not published" }]} />
                        </div>
                        {d.kind === "fixed" && (
                          <div className="flex flex-wrap items-end gap-3">
                            <Field label="Date" required><Input disabled={ro} type="date" className="w-40" value={d.date} onChange={(e) => setIntake(i, { deadline: { ...d, date: e.target.value } })} /></Field>
                            <Field label="Deadline of"><Select disabled={ro} className="w-44" value={d.type} onChange={(e) => setIntake(i, { deadline: { ...d, type: e.target.value as typeof d.type } })}>
                              <option value="university">University</option><option value="uni_assist">Uni-Assist</option><option value="scholarship">Scholarship</option><option value="document">Documents</option></Select></Field>
                          </div>
                        )}
                        {d.kind === "not_published" && <p className="text-tiny text-n-500">Shown as “not published”. It is never treated as open.</p>}
                      </div>
                      <div className="flex flex-wrap items-end gap-3">
                        <Field label="Application route"><Select disabled={ro} className="w-52" value={it.route?.type ?? ""} onChange={(e) => setIntake(i, { route: e.target.value ? { ...it.route, type: e.target.value as ApplicationRouteType } : null })}>
                          <option value="">Not recorded</option>{Object.entries(ROUTE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
                        {it.route && <>
                          <Field label="Portal name" optional><Input disabled={ro} className="w-40" value={it.route.portalName ?? ""} onChange={(e) => setIntake(i, { route: { ...it.route!, portalName: e.target.value || undefined } })} /></Field>
                          <Field label="Portal address" optional><Input disabled={ro} type="url" className="w-56" value={it.route.portalUrl ?? ""} onChange={(e) => setIntake(i, { route: { ...it.route!, portalUrl: e.target.value || undefined } })} placeholder="https://" /></Field>
                        </>}
                      </div>
                      <div className="flex flex-wrap items-end gap-3">
                        <Field label="Application fee" hint="Empty = unknown"><NumberInput disabled={ro} className="w-28" value={it.applicationFee?.amount ?? null}
                          onChange={(n) => setIntake(i, { applicationFee: n == null ? null : { amount: n, currency: it.applicationFee?.currency ?? country?.currency ?? "EUR" } })} /></Field>
                        <Field label="Currency"><Input disabled={ro || !it.applicationFee} className="w-20" value={it.applicationFee?.currency ?? ""} onChange={(e) => it.applicationFee && setIntake(i, { applicationFee: { ...it.applicationFee, currency: e.target.value.toUpperCase().slice(0, 3) } })} /></Field>
                        <Field label="Tuition" hint="Empty = unknown"><NumberInput disabled={ro} className="w-28" value={it.tuition?.amount ?? null}
                          onChange={(n) => setIntake(i, { tuition: n == null ? null : { amount: n, currency: it.tuition?.currency ?? country?.currency ?? "EUR", per: it.tuition?.per ?? "year" } })} /></Field>
                        <Field label="Per"><Select disabled={ro || !it.tuition} className="w-32" value={it.tuition?.per ?? "year"} onChange={(e) => it.tuition && setIntake(i, { tuition: { ...it.tuition, per: e.target.value as "year" } })}>
                          <option value="year">Year</option><option value="semester">Semester</option><option value="programme">Programme</option></Select></Field>
                      </div>
                      {errors[`intake${i}`] && <p className="text-tiny text-bad-400">{errors[`intake${i}`]}</p>}
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <Section title="Notes and source">
            <div className="grid grid-cols-1 gap-4">
              <Field label="Official source URL" optional error={errors.sourceUrl} hint="The university's own page. Required before the record can be verified.">
                <Input disabled={ro} type="url" value={draft.source.url ?? ""} onChange={(e) => set("source", { ...draft.source, url: e.target.value || null })} placeholder="https://" />
              </Field>
              <Field label="Scholarships"><Select disabled={ro} className="w-48" value={draft.scholarshipAvailable == null ? "" : draft.scholarshipAvailable ? "yes" : "no"}
                onChange={(e) => set("scholarshipAvailable", e.target.value === "" ? null : e.target.value === "yes")}><option value="">Not recorded</option><option value="yes">Available</option><option value="no">None known</option></Select></Field>
              <Field label="Note for counselors (staff only)" optional><Textarea disabled={ro} rows={2} value={draft.counselorNote ?? ""} onChange={(e) => set("counselorNote", e.target.value || undefined)} /></Field>
              <Field label="Note students may see" optional><Textarea disabled={ro} rows={2} value={draft.studentNote ?? ""} onChange={(e) => set("studentNote", e.target.value || undefined)} /></Field>
            </div>
          </Section>
        </div>

        <div className="space-y-4">
          {saved && (
            <Section title="Verification" description="Move the record through review. Verifying stamps today's date and your name.">
              <div className="flex flex-wrap gap-2">
                {RECORD_NEXT[saved.status].map((s) => (
                  <Button key={s} size="sm" variant={s === "verified" ? "primary" : s === "archived" ? "ghost" : "secondary"} disabled={ro || dirty}
                    title={ro ? perm.why("catalog.manage") : dirty ? "Save or discard your edits first" : undefined}
                    onClick={() => { setMoving(s); setReason(""); setReasonError(undefined); }}>{RECORD_ACTION[s]}</Button>
                ))}
              </div>
              {dirty && <p className="mt-2 text-tiny text-n-500">Save your edits before changing the record&apos;s status.</p>}
              <p className="mt-3 text-tiny text-n-500">Records are reviewed every {REVIEW_INTERVAL_DAYS} days; after that a verified record is flagged as stale.</p>
            </Section>
          )}

          <Section title="Which rules apply" description="Most specific wins. A country default never overwrites a programme or intake requirement.">
            <ol className="space-y-3 text-sm">
              <li><Tag>1 · Intake</Tag><p className="mt-1 text-tiny text-n-400">Deadlines, route and fees set on each intake above.</p></li>
              <li><Tag>2 · Programme</Tag><p className="mt-1 text-tiny text-n-400">The academic and language requirements on this page.</p></li>
              <li><Tag>3 · University</Tag><p className="mt-1 text-tiny text-n-400">{uni ? <Link href="/admin/catalog/universities" className="text-link underline underline-offset-2">{uni.name}</Link> : "Not chosen"}{uni ? `: ${uni.type ?? "type not recorded"}` : ""}</p></li>
              <li><Tag>4 · Country guidance</Tag>
                {country ? (
                  <div className="mt-1 space-y-1 text-tiny text-n-400">
                    {[country.gradingNote, country.languageNote, country.processNote, country.documentNote, country.feeNote].filter(Boolean).map((n) => <p key={n}>“{n}”</p>)}
                    {![country.gradingNote, country.languageNote, country.processNote, country.documentNote, country.feeNote].some(Boolean) && <p>No country-wide guidance recorded for {country.name}.</p>}
                    <p className="text-n-500">Only fills gaps; shown to counselors as guidance, not as this programme&apos;s requirement.</p>
                  </div>
                ) : <p className="mt-1 text-tiny text-n-400">Set by the university&apos;s country.</p>}
              </li>
            </ol>
          </Section>

          {saved && (
            <Section title="Linked applications">
              <p className="text-sm text-n-200"><span className="tabular-nums font-medium">{linkedApps}</span> application{linkedApps === 1 ? "" : "s"} point to this programme.</p>
              <p className="mt-1 text-tiny text-n-500">Archiving keeps every link and each application&apos;s saved copy of the requirements. Programmes are never deleted.</p>
            </Section>
          )}

          <Section title="Change history" description="Edits made in this browser, with before and after." flush>
            {history.length === 0 ? <Empty title="No changes recorded here yet" /> : (
              <ul className="divide-y divide-line">
                {history.map((h) => (
                  <li key={h.id} className="px-5 py-3">
                    <p className="text-sm text-n-100">{h.action === "program.created" ? "Created" : h.action === "program.status_changed" ? "Status changed" : "Edited"} by {nameOf(h.actorId)}</p>
                    <p className="text-tiny tabular-nums text-n-500">{formatDate(h.at)}</p>
                    {h.reason && <p className="text-tiny text-n-300">“{h.reason}”</p>}
                    {h.before && <details className="mt-1 text-tiny text-n-400"><summary className="cursor-pointer text-n-500 hover:text-n-100">{Object.keys(h.after ?? {}).length} field{Object.keys(h.after ?? {}).length === 1 ? "" : "s"} changed</summary>
                      <ul className="mt-1 space-y-1">{Object.keys(h.after ?? {}).map((k) => (
                        <li key={k} className="break-words"><span className="font-medium text-n-200">{k}</span>: <span className="line-through">{JSON.stringify(h.before?.[k])?.slice(0, 80) ?? "none"}</span> → {JSON.stringify(h.after?.[k])?.slice(0, 80)}</li>
                      ))}</ul></details>}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>

      <Sheet open={saving} onClose={() => setSaving(false)} title={isNew ? "Create programme" : "Save changes"}
        description={saved?.status === "verified" ? "This record is verified. Saving sends it back to “pending review”." : "The editor, date and reason are kept with the change."}
        footer={<><Button variant="ghost" onClick={() => setSaving(false)}>Cancel</Button><Button variant="primary" onClick={confirmSave}>{isNew ? "Create" : "Save"}</Button></>}>
        <Field label="What changed and why" required={!!saved} optional={!saved} error={reasonError}><Textarea data-autofocus rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={saved ? "Updated IELTS minimum from the 2027 admissions page." : undefined} /></Field>
        {isNew && <p className="mt-3 text-tiny text-n-500">New programmes start as drafts. They are not verified until someone checks them against the official source.</p>}
      </Sheet>

      <Sheet open={!!moving} onClose={() => setMoving(null)} title={moving ? RECORD_ACTION[moving] : ""} description={saved ? `${saved.degreeTitle} ${saved.name}` : undefined}
        footer={<><Button variant="ghost" onClick={() => setMoving(null)}>Cancel</Button><Button variant={moving === "archived" ? "danger" : "primary"} onClick={confirmMove}>{moving ? RECORD_ACTION[moving] : ""}</Button></>}>
        <div className="space-y-4">
          {moving === "verified" && <Note>Confirm you checked the requirements, deadlines and fees against <span className="break-all">{saved?.source.url ?? "the official source"}</span>. Today&apos;s date and your name are recorded.</Note>}
          {moving === "archived" && <Note tone="warn">{linkedApps} linked application{linkedApps === 1 ? "" : "s"} keep their link. Counselors no longer see it in the programme bank by default.</Note>}
          <Field label="Reason" required={!!moving && RECORD_NEEDS_REASON.has(moving)} optional={!!moving && !RECORD_NEEDS_REASON.has(moving)} error={reasonError}>
            <Textarea data-autofocus rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </div>
      </Sheet>
    </div>
  );
}
