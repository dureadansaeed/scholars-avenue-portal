"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/overlays";
import { Empty, Note, Section } from "@/components/ui/panels";
import { Tag } from "@/components/ui/chips";
import { formatDate } from "@/lib/clock";
import type { AcademicRecord, QualificationLevel } from "@/types";
import { GRADE_KIND_LABEL, LEVEL_LABEL, reviewAfterEdit } from "./profile-utils";
import { ReviewLine } from "./review-line";

type Draft = Omit<AcademicRecord, "gradeObtained" | "gradeScale" | "backlogs" | "review" | "studentId" | "id"> & {
  gradeObtained: string; gradeScale: string; backlogs: string;
};

const blank = (): Draft => ({
  level: "bachelor", title: "", major: "", institution: "", institutionCountry: "", institutionCity: "",
  startDate: "", endDate: "", endIsExpected: false, studyMode: "full_time", gradeObtained: "", gradeScale: "",
  gradeKind: "cgpa", backlogs: "", awardStatus: "awarded", thesisTitle: "", gapNote: "", classOrRank: "",
});
const toDraft = (r: AcademicRecord): Draft => ({
  ...blank(), ...r, institutionCity: r.institutionCity ?? "", startDate: r.startDate ?? "", endDate: r.endDate ?? "",
  thesisTitle: r.thesisTitle ?? "", gapNote: r.gapNote ?? "", classOrRank: r.classOrRank ?? "",
  gradeObtained: r.gradeObtained?.toString() ?? "", gradeScale: r.gradeScale?.toString() ?? "", backlogs: r.backlogs?.toString() ?? "",
});
const num = (s: string) => (s.trim() === "" ? null : Number(s));

const summary = (r: AcademicRecord) => `${r.title}, ${r.gradeObtained ?? "no grade"}${r.gradeScale ? ` / ${r.gradeScale}` : ""}`;

function validate(d: Draft) {
  const e: Partial<Record<keyof Draft, string>> = {};
  if (!d.title.trim()) e.title = "Enter the qualification title, for example BSc Computer Science.";
  if (!d.institution.trim()) e.institution = "Enter the institution name.";
  if (!d.institutionCountry.trim()) e.institutionCountry = "Enter the country.";
  const g = num(d.gradeObtained), s = num(d.gradeScale);
  if (d.gradeObtained && Number.isNaN(g)) e.gradeObtained = "Enter a number.";
  if (d.gradeScale && (Number.isNaN(s) || (s ?? 0) <= 0)) e.gradeScale = "Enter a number above 0.";
  if (g != null && s == null) e.gradeScale = "Add the maximum of your grading scale (for example 4.0, 5, 10 or 100). We never assume it.";
  if (s != null && g == null) e.gradeObtained = "Add the grade you obtained on that scale.";
  if (g != null && s != null && !Number.isNaN(g) && !Number.isNaN(s) && g > s) e.gradeObtained = "The grade cannot be higher than the scale maximum.";
  if (d.startDate && d.endDate && d.endDate < d.startDate) e.endDate = "The end date cannot be before the start date.";
  if (d.backlogs && (Number.isNaN(Number(d.backlogs)) || Number(d.backlogs) < 0)) e.backlogs = "Enter 0 or a positive number.";
  return e;
}

export function AcademicSection({ studentId, records, reviewerNames, savedAt, onChange }: {
  studentId: string; records: AcademicRecord[]; reviewerNames: Record<string, string>; savedAt?: string;
  onChange: (next: AcademicRecord[]) => void;
}) {
  const [editing, setEditing] = useState<{ id: string | null } | null>(null);
  const [draft, setDraft] = useState<Draft>(blank());
  const [errors, setErrors] = useState<ReturnType<typeof validate>>({});

  const open = (r?: AcademicRecord) => { setDraft(r ? toDraft(r) : blank()); setErrors({}); setEditing({ id: r?.id ?? null }); };
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const save = () => {
    const found = validate(draft);
    setErrors(found);
    if (Object.keys(found).length) return;
    const base = {
      ...draft, gradeObtained: num(draft.gradeObtained), gradeScale: num(draft.gradeScale), backlogs: num(draft.backlogs),
      startDate: draft.startDate || undefined, endDate: draft.endDate || undefined, institutionCity: draft.institutionCity || undefined,
      thesisTitle: draft.thesisTitle || undefined, gapNote: draft.gapNote || undefined, classOrRank: draft.classOrRank || undefined,
    };
    const prev = records.find((r) => r.id === editing?.id);
    if (prev) {
      const prevCore: Record<string, unknown> = { ...prev };
      delete prevCore.review;
      const changed = JSON.stringify({ ...prevCore, ...base }) !== JSON.stringify(prevCore);
      const review = reviewAfterEdit(prev.review, summary(prev), changed) ?? prev.review;
      onChange(records.map((r) => (r.id === prev.id ? { ...prev, ...base, review } : r)));
    } else {
      onChange([...records, { ...base, id: `ac-${crypto.randomUUID().slice(0, 8)}`, studentId, review: { status: "unverified" } }]);
    }
    setEditing(null);
  };

  const editingVerified = records.find((r) => r.id === editing?.id)?.review.status === "verified";

  return (
    <Section id="academic" title="Academic history" description="Add every qualification, starting with the most recent. Grades are stored with their scale."
      actions={<Button size="sm" onClick={() => open()}><Icon.Plus className="size-3.5" />Add qualification</Button>} flush>
      {records.length === 0 ? (
        <Empty title="No qualifications added yet" action={<Button variant="primary" size="sm" onClick={() => open()}>Add your first qualification</Button>}>
          Your counselor needs at least one with a grade and its scale to compare you with programmes.
        </Empty>
      ) : (
        <ul className="divide-y divide-line">
          {records.map((r) => (
            <li key={r.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-n-100">{r.title}</p>
                  <p className="text-tiny text-n-400">{r.institution}, {r.institutionCountry}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Tag>{LEVEL_LABEL[r.level]}</Tag>
                    <Tag className="tabular-nums">
                      {r.gradeObtained != null && r.gradeScale != null ? `${r.gradeObtained} / ${r.gradeScale}` : "Grade not entered"}
                    </Tag>
                    {r.endDate && <Tag className="tabular-nums">{r.endIsExpected ? "Expected " : "Completed "}{formatDate(r.endDate)}</Tag>}
                    {r.backlogs != null && r.backlogs > 0 && <Tag>{r.backlogs} backlog{r.backlogs > 1 ? "s" : ""}</Tag>}
                  </div>
                  <ReviewLine review={r.review} reviewerNames={reviewerNames} />
                </div>
                <Button size="sm" variant="ghost" onClick={() => open(r)}><Icon.Edit className="size-3.5" />Edit</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {savedAt && <p role="status" className="border-t border-line px-5 py-3 text-tiny text-ok-400">Saved.</p>}

      <Sheet open={editing != null} onClose={() => setEditing(null)} title={editing?.id ? "Edit qualification" : "Add qualification"}
        description="Use the official name and the grade exactly as printed on your transcript."
        footer={<><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button variant="primary" onClick={save}>Save qualification</Button></>}>
        <div className="space-y-4">
          {editingVerified && <Note tone="warn" title="This record is verified">Saving changes returns it to your counselor for review. The earlier version stays in its history.</Note>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Level" required>
              <Select value={draft.level} onChange={(e) => set("level", e.target.value as QualificationLevel)}>
                {Object.entries(LEVEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </Field>
            <Field label="Qualification title" required error={errors.title}><Input value={draft.title} onChange={(e) => set("title", e.target.value)} placeholder="BSc Computer Science" /></Field>
            <Field label="Major / discipline" optional><Input value={draft.major} onChange={(e) => set("major", e.target.value)} /></Field>
            <Field label="Institution" required error={errors.institution}><Input value={draft.institution} onChange={(e) => set("institution", e.target.value)} /></Field>
            <Field label="Country" required error={errors.institutionCountry}><Input value={draft.institutionCountry} onChange={(e) => set("institutionCountry", e.target.value)} /></Field>
            <Field label="City" optional><Input value={draft.institutionCity} onChange={(e) => set("institutionCity", e.target.value)} /></Field>
            <Field label="Start date" optional><Input type="date" value={draft.startDate} onChange={(e) => set("startDate", e.target.value)} /></Field>
            <Field label="End date" optional error={errors.endDate}><Input type="date" value={draft.endDate} onChange={(e) => set("endDate", e.target.value)} /></Field>
          </div>
          <label className="flex items-center gap-2.5 text-sm text-n-200">
            <input type="checkbox" className="size-4 accent-blue-500" checked={draft.endIsExpected} onChange={(e) => set("endIsExpected", e.target.checked)} />
            The end date is an expected date (I have not finished yet)
          </label>
          <div className="rounded-md border border-line bg-raised p-4">
            <p className="text-sm font-medium text-n-100">Grade</p>
            <p className="mt-0.5 text-tiny text-n-400">Enter what you obtained and the maximum possible, separately. A 3.4 out of 5.0 is very different from 3.4 out of 4.0.</p>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Grade type"><Select value={draft.gradeKind} onChange={(e) => set("gradeKind", e.target.value as Draft["gradeKind"])}>
                {Object.entries(GRADE_KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
              <Field label="Obtained" error={errors.gradeObtained}><Input inputMode="decimal" value={draft.gradeObtained} onChange={(e) => set("gradeObtained", e.target.value)} placeholder="3.4" /></Field>
              <Field label="Out of (scale maximum)" error={errors.gradeScale}><Input inputMode="decimal" value={draft.gradeScale} onChange={(e) => set("gradeScale", e.target.value)} placeholder="4.0" /></Field>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Result status" required>
              <Select value={draft.awardStatus} onChange={(e) => set("awardStatus", e.target.value as Draft["awardStatus"])}>
                <option value="awarded">Degree awarded</option><option value="awaiting_result">Finished, awaiting result</option><option value="in_progress">Still studying</option>
              </Select>
            </Field>
            <Field label="Backlogs / failed courses" optional error={errors.backlogs} hint="Enter 0 if none."><Input inputMode="numeric" value={draft.backlogs} onChange={(e) => set("backlogs", e.target.value)} /></Field>
          </div>
          <Field label="Thesis or final-year project title" optional><Input value={draft.thesisTitle} onChange={(e) => set("thesisTitle", e.target.value)} /></Field>
          <Field label="Gap in studies or other notes" optional hint="For example work experience between degrees."><Textarea rows={2} value={draft.gapNote} onChange={(e) => set("gapNote", e.target.value)} /></Field>
          {Object.keys(errors).length > 0 && <Note tone="bad" title="Please fix the highlighted fields">What you entered is still here.</Note>}
        </div>
      </Sheet>
    </Section>
  );
}
