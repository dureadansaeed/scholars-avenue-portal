"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";
import { Note, Section } from "@/components/ui/panels";
import { cx } from "@/lib/cx";
import { countries } from "@/mocks/countries";
import type { DegreeLevel, StudentPreference } from "@/types";

const DEGREES: { value: DegreeLevel; label: string }[] = [
  { value: "bachelor", label: "Bachelor's" }, { value: "master", label: "Master's" }, { value: "phd", label: "PhD" },
];

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={cx("press rounded-full border px-3 py-1 text-tiny", on ? "border-blue-500 bg-info-tint font-medium text-n-100" : "border-line-strong text-n-300 hover:bg-n-850")}>
      {children}
    </button>
  );
}

export function PreferencesSection({ preference, savedAt, onSave }: {
  preference: StudentPreference; savedAt?: string; onSave: (p: StudentPreference) => void;
}) {
  const [p, setP] = useState(preference);
  const [subjects, setSubjects] = useState(preference.subjects.join(", "));
  const [cities, setCities] = useState(preference.cities.join(", "));
  const [budget, setBudget] = useState(preference.tuitionMax?.amount.toString() ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const split = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (budget && (Number.isNaN(Number(budget)) || Number(budget) < 0)) err.budget = "Enter an amount, or leave it empty if you have no limit.";
    setErrors(err);
    if (Object.keys(err).length) return;
    onSave({
      ...p, subjects: split(subjects), cities: split(cities),
      tuitionMax: budget ? { amount: Number(budget), currency: p.tuitionMax?.currency ?? "EUR" } : undefined,
    });
  };

  return (
    <Section id="preferences" title="Study preferences" description="Your counselor uses these to look for programmes. You can change them any time.">
      <form onSubmit={save} noValidate className="space-y-5">
        <fieldset>
          <legend className="mb-2 text-micro font-medium tracking-wide text-n-400 uppercase">Countries you would consider <span className="normal-case tracking-normal text-n-500">Required</span></legend>
          <div className="flex flex-wrap gap-2">
            {countries.filter((c) => c.active).map((c) => (
              <Toggle key={c.code} on={p.countries.includes(c.code)} onClick={() => setP((x) => ({ ...x, countries: toggle(x.countries, c.code) }))}>{c.name}</Toggle>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-micro font-medium tracking-wide text-n-400 uppercase">Degree level <span className="normal-case tracking-normal text-n-500">Required</span></legend>
          <div className="flex flex-wrap gap-2">
            {DEGREES.map((d) => <Toggle key={d.value} on={p.degreeLevels.includes(d.value)} onClick={() => setP((x) => ({ ...x, degreeLevels: toggle(x.degreeLevels, d.value) }))}>{d.label}</Toggle>)}
          </div>
        </fieldset>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Subject areas" required hint="Separate with commas."><Input value={subjects} onChange={(e) => setSubjects(e.target.value)} placeholder="Computer Science, Data Science" /></Field>
          <Field label="Intended intake" required hint="For example Winter 2027."><Input value={p.intake ?? ""} onChange={(e) => setP((x) => ({ ...x, intake: e.target.value }))} /></Field>
          <Field label="Study mode" optional>
            <Select value={p.studyMode ?? ""} onChange={(e) => setP((x) => ({ ...x, studyMode: (e.target.value || undefined) as StudentPreference["studyMode"] }))}>
              <option value="">No preference</option><option value="full_time">Full-time</option><option value="part_time">Part-time</option>
            </Select>
          </Field>
          <Field label="Preferred cities" optional hint="Separate with commas."><Input value={cities} onChange={(e) => setCities(e.target.value)} /></Field>
          <Field label="Maximum yearly tuition" optional error={errors.budget} hint="Your counselor treats this as a guide, not a guarantee.">
            <div className="flex gap-2">
              <Input inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="8000" />
              <Select className="w-24" value={p.tuitionMax?.currency ?? "EUR"} aria-label="Currency"
                onChange={(e) => setP((x) => ({ ...x, tuitionMax: { amount: Number(budget) || 0, currency: e.target.value } }))}>
                {["EUR", "GBP", "USD", "AUD", "SEK"].map((c) => <option key={c}>{c}</option>)}
              </Select>
            </div>
          </Field>
        </div>
        <Checkbox label="I am interested in scholarships" checked={p.scholarshipInterest} onChange={(e) => setP((x) => ({ ...x, scholarshipInterest: e.target.checked }))} />
        {Object.keys(errors).length > 0 && <Note tone="bad" title="Please fix the highlighted fields" />}
        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary">Save preferences</Button>
          {savedAt && <span role="status" className="text-tiny text-ok-400">Saved.</span>}
        </div>
      </form>
    </Section>
  );
}
