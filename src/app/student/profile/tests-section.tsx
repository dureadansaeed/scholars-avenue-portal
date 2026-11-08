"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/overlays";
import { Empty, Note, Section } from "@/components/ui/panels";
import { Status, Tag } from "@/components/ui/chips";
import { daysUntil, formatDate } from "@/lib/clock";
import type { LanguageTest, LanguageTestType, OtherTest, OtherTestType } from "@/types";
import { reviewAfterEdit, TEST_LABEL } from "./profile-utils";
import { ReviewLine } from "./review-line";

const COMPONENTS = ["listening", "reading", "writing", "speaking"] as const;
const LANG_TYPES: LanguageTestType[] = ["ielts_academic", "ielts_general", "toefl_ibt", "pte_academic", "cambridge", "duolingo", "testdaf", "goethe", "other"];
const OTHER_TYPES: OtherTestType[] = ["gre", "gmat", "sat", "act", "testas", "german_cefr", "other"];
// Suggested scale only; the student can overwrite it. Scores are never converted between tests.
const DEFAULT_MAX: Partial<Record<LanguageTestType, string>> = { ielts_academic: "9", ielts_general: "9", toefl_ibt: "120", pte_academic: "90", duolingo: "160" };

function ExpiryChip({ expiresOn }: { expiresOn?: string }) {
  if (!expiresOn) return null;
  const d = daysUntil(expiresOn);
  if (d < 0) return <Status tone="bad">Expired {formatDate(expiresOn)}</Status>;
  if (d <= 180) return <Status tone="warn">Expires in {d} days</Status>;
  return <Tag className="tabular-nums">Valid until {formatDate(expiresOn)}</Tag>;
}

// ---------------- language tests ----------------
interface LDraft {
  type: LanguageTestType; testDate: string; overall: string; maxScore: string; expiresOn: string; reportRef: string;
  listening: string; reading: string; writing: string; speaking: string;
}
const lBlank = (): LDraft => ({ type: "ielts_academic", testDate: "", overall: "", maxScore: "9", expiresOn: "", reportRef: "", listening: "", reading: "", writing: "", speaking: "" });
const lDraft = (t: LanguageTest): LDraft => ({
  type: t.type, testDate: t.testDate, overall: t.overall?.toString() ?? "", maxScore: t.maxScore?.toString() ?? "", expiresOn: t.expiresOn ?? "",
  reportRef: t.reportRef ?? "", listening: t.components.listening?.toString() ?? "", reading: t.components.reading?.toString() ?? "",
  writing: t.components.writing?.toString() ?? "", speaking: t.components.speaking?.toString() ?? "",
});
const n = (s: string) => (s.trim() === "" ? null : Number(s));

export function LanguageSection({ studentId, tests, reviewerNames, onChange }: {
  studentId: string; tests: LanguageTest[]; reviewerNames: Record<string, string>; onChange: (next: LanguageTest[]) => void;
}) {
  const [editing, setEditing] = useState<{ id: string | null } | null>(null);
  const [d, setD] = useState<LDraft>(lBlank());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof LDraft>(k: K, v: LDraft[K]) => setD((x) => ({ ...x, [k]: v }));
  const open = (t?: LanguageTest) => { setD(t ? lDraft(t) : lBlank()); setErrors({}); setEditing({ id: t?.id ?? null }); };

  const save = () => {
    const e: Record<string, string> = {};
    if (!d.testDate) e.testDate = "Enter the date you sat the test.";
    if (!d.overall || Number.isNaN(Number(d.overall))) e.overall = "Enter your overall score.";
    if (!d.maxScore || Number(d.maxScore) <= 0) e.maxScore = "Enter the maximum score of this test.";
    const max = Number(d.maxScore);
    for (const k of ["overall", ...COMPONENTS] as const) {
      const v = n(d[k]);
      if (v != null && (Number.isNaN(v) || v < 0 || v > max)) e[k] = `Enter a score between 0 and ${max}.`;
    }
    if (d.expiresOn && d.testDate && d.expiresOn < d.testDate) e.expiresOn = "The expiry cannot be before the test date.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const core = {
      type: d.type, testDate: d.testDate, overall: n(d.overall), maxScore: n(d.maxScore), expiresOn: d.expiresOn || undefined,
      reportRef: d.reportRef || undefined,
      components: Object.fromEntries(COMPONENTS.map((k) => [k, n(d[k])]).filter(([, v]) => v != null)) as LanguageTest["components"],
    };
    const prev = tests.find((t) => t.id === editing?.id);
    if (prev) {
      const prevCore: Record<string, unknown> = { ...prev };
      for (const k of ["review", "id", "studentId", "documentId"]) delete prevCore[k];
      const changed = JSON.stringify({ ...prevCore, ...core }) !== JSON.stringify(prevCore);
      const review = reviewAfterEdit(prev.review, `${TEST_LABEL[prev.type]} ${prev.overall}`, changed) ?? prev.review;
      onChange(tests.map((t) => (t.id === prev.id ? { ...prev, ...core, review } : t)));
    } else {
      onChange([...tests, { ...core, id: `lt-${crypto.randomUUID().slice(0, 8)}`, studentId, review: { status: "unverified" } }]);
    }
    setEditing(null);
  };

  return (
    <Section id="language" title="English and other language tests" description="Exact scores only. We never convert one test into another."
      actions={<Button size="sm" onClick={() => open()}><Icon.Plus className="size-3.5" />Add test</Button>} flush>
      {tests.length === 0 ? (
        <Empty title="No language tests added" action={<Button variant="primary" size="sm" onClick={() => open()}>Add a test</Button>}>
          If you have not taken one yet, tell your counselor in a message.
        </Empty>
      ) : (
        <ul className="divide-y divide-line">
          {tests.map((t) => (
            <li key={t.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-n-100">{TEST_LABEL[t.type]} <span className="font-normal tabular-nums text-n-400">· {t.overall ?? "no score"}{t.maxScore ? ` / ${t.maxScore}` : ""}</span></p>
                <p className="mt-0.5 text-tiny tabular-nums text-n-400">
                  {COMPONENTS.filter((k) => t.components[k] != null).map((k) => `${k[0].toUpperCase()}${k.slice(1, 3)} ${t.components[k]}`).join(" · ") || "No component scores"}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Tag className="tabular-nums">Taken {formatDate(t.testDate)}</Tag><ExpiryChip expiresOn={t.expiresOn} />
                </div>
                <ReviewLine review={t.review} reviewerNames={reviewerNames} />
              </div>
              <Button size="sm" variant="ghost" onClick={() => open(t)}><Icon.Edit className="size-3.5" />Edit</Button>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={editing != null} onClose={() => setEditing(null)} title={editing?.id ? "Edit language test" : "Add language test"}
        footer={<><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button variant="primary" onClick={save}>Save test</Button></>}>
        <div className="space-y-4">
          {tests.find((t) => t.id === editing?.id)?.review.status === "verified" && (
            <Note tone="warn" title="This test is verified">Saving changes sends it back for review.</Note>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Test" required>
              <Select value={d.type} onChange={(e) => { const type = e.target.value as LanguageTestType; setD((x) => ({ ...x, type, maxScore: DEFAULT_MAX[type] ?? x.maxScore })); }}>
                {LANG_TYPES.map((t) => <option key={t} value={t}>{TEST_LABEL[t]}</option>)}
              </Select>
            </Field>
            <Field label="Test date" required error={errors.testDate}><Input type="date" value={d.testDate} onChange={(e) => set("testDate", e.target.value)} /></Field>
            <Field label="Overall score" required error={errors.overall}><Input inputMode="decimal" value={d.overall} onChange={(e) => set("overall", e.target.value)} /></Field>
            <Field label="Maximum score" required error={errors.maxScore}><Input inputMode="decimal" value={d.maxScore} onChange={(e) => set("maxScore", e.target.value)} /></Field>
          </div>
          <div className="rounded-md border border-line bg-raised p-4">
            <p className="text-sm font-medium text-n-100">Component scores <span className="text-tiny font-normal text-n-500">Optional, but many programmes set minimums per skill</span></p>
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {COMPONENTS.map((k) => (
                <Field key={k} label={k[0].toUpperCase() + k.slice(1)} error={errors[k]}>
                  <Input inputMode="decimal" value={d[k]} onChange={(e) => set(k, e.target.value)} />
                </Field>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Valid until" optional error={errors.expiresOn} hint="Only if your report states an expiry."><Input type="date" value={d.expiresOn} onChange={(e) => set("expiresOn", e.target.value)} /></Field>
            <Field label="Report reference" optional hint="Only your counselor can see this."><Input value={d.reportRef} onChange={(e) => set("reportRef", e.target.value)} /></Field>
          </div>
          {Object.keys(errors).length > 0 && <Note tone="bad" title="Please fix the highlighted fields">What you entered is still here.</Note>}
        </div>
      </Sheet>
    </Section>
  );
}

// ---------------- other tests ----------------
interface ODraft { type: OtherTestType; testDate: string; score: string; maxScore: string; cefr: string; expiresOn: string }
const oBlank = (): ODraft => ({ type: "gre", testDate: "", score: "", maxScore: "", cefr: "", expiresOn: "" });

export function OtherTestsSection({ studentId, tests, reviewerNames, onChange }: {
  studentId: string; tests: OtherTest[]; reviewerNames: Record<string, string>; onChange: (next: OtherTest[]) => void;
}) {
  const [editing, setEditing] = useState<{ id: string | null } | null>(null);
  const [d, setD] = useState<ODraft>(oBlank());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const open = (t?: OtherTest) => {
    setD(t ? { type: t.type, testDate: t.testDate, score: t.score?.toString() ?? "", maxScore: t.maxScore?.toString() ?? "", cefr: t.cefr ?? "", expiresOn: t.expiresOn ?? "" } : oBlank());
    setErrors({}); setEditing({ id: t?.id ?? null });
  };
  const save = () => {
    const e: Record<string, string> = {};
    if (!d.testDate) e.testDate = "Enter the test date.";
    if (d.type === "german_cefr" ? !d.cefr : !d.score || Number.isNaN(Number(d.score))) e.score = d.type === "german_cefr" ? "Choose your level." : "Enter your score.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const core = { type: d.type, testDate: d.testDate, score: n(d.score), maxScore: n(d.maxScore), cefr: (d.cefr || undefined) as OtherTest["cefr"], expiresOn: d.expiresOn || undefined };
    const prev = tests.find((t) => t.id === editing?.id);
    if (prev) {
      const review = reviewAfterEdit(prev.review, `${TEST_LABEL[prev.type]} ${prev.score ?? prev.cefr}`, true) ?? prev.review;
      onChange(tests.map((t) => (t.id === prev.id ? { ...prev, ...core, review } : t)));
    } else onChange([...tests, { ...core, id: `ot-${crypto.randomUUID().slice(0, 8)}`, studentId, review: { status: "unverified" } }]);
    setEditing(null);
  };
  return (
    <Section title="Other tests" description="GRE, GMAT, TestAS, German level and similar." flush
      actions={<Button size="sm" onClick={() => open()}><Icon.Plus className="size-3.5" />Add test</Button>}>
      {tests.length === 0 ? <p className="px-5 py-6 text-tiny text-n-500">None added. Only add tests that a programme asks for.</p> : (
        <ul className="divide-y divide-line">
          {tests.map((t) => (
            <li key={t.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3">
              <div>
                <p className="text-sm font-medium text-n-100">{TEST_LABEL[t.type]} <span className="font-normal tabular-nums text-n-400">· {t.cefr ?? `${t.score}${t.maxScore ? ` / ${t.maxScore}` : ""}`}</span></p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5"><Tag className="tabular-nums">Taken {formatDate(t.testDate)}</Tag><ExpiryChip expiresOn={t.expiresOn} /></div>
                <ReviewLine review={t.review} reviewerNames={reviewerNames} />
              </div>
              <Button size="sm" variant="ghost" onClick={() => open(t)}><Icon.Edit className="size-3.5" />Edit</Button>
            </li>
          ))}
        </ul>
      )}
      <Sheet open={editing != null} onClose={() => setEditing(null)} title={editing?.id ? "Edit test" : "Add test"}
        footer={<><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button variant="primary" onClick={save}>Save test</Button></>}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Test" required><Select value={d.type} onChange={(e) => setD((x) => ({ ...x, type: e.target.value as OtherTestType }))}>
            {OTHER_TYPES.map((t) => <option key={t} value={t}>{TEST_LABEL[t]}</option>)}</Select></Field>
          <Field label="Test date" required error={errors.testDate}><Input type="date" value={d.testDate} onChange={(e) => setD((x) => ({ ...x, testDate: e.target.value }))} /></Field>
          {d.type === "german_cefr" ? (
            <Field label="Level" required error={errors.score}><Select value={d.cefr} onChange={(e) => setD((x) => ({ ...x, cefr: e.target.value }))}>
              <option value="">Choose…</option>{["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => <option key={l}>{l}</option>)}</Select></Field>
          ) : (<>
            <Field label="Score" required error={errors.score}><Input inputMode="decimal" value={d.score} onChange={(e) => setD((x) => ({ ...x, score: e.target.value }))} /></Field>
            <Field label="Maximum score" optional><Input inputMode="decimal" value={d.maxScore} onChange={(e) => setD((x) => ({ ...x, maxScore: e.target.value }))} /></Field>
          </>)}
          <Field label="Valid until" optional><Input type="date" value={d.expiresOn} onChange={(e) => setD((x) => ({ ...x, expiresOn: e.target.value }))} /></Field>
        </div>
      </Sheet>
    </Section>
  );
}
