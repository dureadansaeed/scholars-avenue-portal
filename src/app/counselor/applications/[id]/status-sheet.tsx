"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Sheet } from "@/components/ui/overlays";
import { Note } from "@/components/ui/panels";
import { STATUS_LABEL, TRANSITIONS, validateTransition } from "@/lib/application-rules";
import { DEMO_NOW } from "@/lib/clock";
import { cx } from "@/lib/cx";
import { flags } from "@/lib/flags";
import { STUDENT_STATUS_LABEL } from "@/lib/student-labels";
import { newId } from "@/lib/use-local-state";
import type { Application, ApplicationEvidence, ApplicationStatus } from "@/types";

const MAX = 10 * 1024 * 1024;
const OK_TYPES = ["application/pdf", "image/png", "image/jpeg"];

/**
 * Records a status change. The rules live in application-rules.ts; this only
 * gathers what they ask for: a reason, submission evidence (or why none exists),
 * and the student's confirmation (or why proceeding without it).
 */
export function StatusSheet({ app, counselorId, studentConfirmed, onClose, onSave }: {
  app: Application; counselorId: string; studentConfirmed: boolean; onClose: () => void; onSave: (next: Application) => void;
}) {
  const options = TRANSITIONS[app.status];
  const [to, setTo] = useState<ApplicationStatus | "">("");
  const [label, setLabel] = useState("");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<{ name: string } | null>(null);
  const [fileError, setFileError] = useState<string>();
  const [noEvidence, setNoEvidence] = useState("");
  const [override, setOverride] = useState("");
  const [submittedOn, setSubmittedOn] = useState(DEMO_NOW.slice(0, 10));
  const [ref, setRef] = useState(app.externalRef ?? "");
  const [conditions, setConditions] = useState(app.conditions ?? "");
  const [errors, setErrors] = useState<string[]>([]);

  const evidenceCount = (app.evidence ?? []).filter((e) => e.filename).length + (file ? 1 : 0);
  const existingReasons = (app.evidence ?? []).some((e) => e.unavailableReason);
  const submitting = to === "submitted";
  const needsOverride = !!to && flags.requireStudentConfirmation && !studentConfirmed && (to === "ready_for_submission" || to === "submitted") && app.status !== "ready_for_submission";

  const pick = (s: ApplicationStatus) => { setTo(s); setLabel(STUDENT_STATUS_LABEL[s]); setErrors([]); };

  const save = () => {
    if (!to) { setErrors(["Choose the new status."]); return; }
    const v = validateTransition({
      from: app.status, to, reason, evidenceCount, evidenceUnavailableReason: noEvidence.trim() || (existingReasons ? "recorded" : undefined),
      studentConfirmed, requireConfirmation: flags.requireStudentConfirmation, confirmationOverrideReason: override,
    });
    const extra: string[] = [];
    if (to === "conditional_offer_received" && !conditions.trim()) extra.push("Record the conditions of the offer.");
    if (!label.trim()) extra.push("The student-facing label cannot be empty.");
    if (!v.ok || extra.length) { setErrors([...v.errors, ...extra]); return; }

    const evidence: ApplicationEvidence[] = [...(app.evidence ?? [])];
    if (file) evidence.push({ id: newId("ev"), kind: "confirmation", filename: file.name, at: DEMO_NOW, by: counselorId });
    else if (noEvidence.trim()) evidence.push({ id: newId("ev"), kind: "other", unavailableReason: noEvidence.trim(), at: DEMO_NOW, by: counselorId });

    const note = [reason.trim(), needsOverride && override.trim() ? `Proceeded without student confirmation: ${override.trim()}` : ""].filter(Boolean).join(" | ");
    const decision = ["offer_received", "conditional_offer_received", "rejected", "waitlisted", "offer_accepted", "offer_declined"].includes(to);
    onSave({
      ...app, status: to, studentStatusLabel: label.trim(), evidence,
      externalRef: submitting && ref.trim() ? ref.trim() : app.externalRef,
      submittedAt: submitting ? submittedOn : app.submittedAt,
      decisionAt: decision ? DEMO_NOW.slice(0, 10) : app.decisionAt,
      conditions: to === "conditional_offer_received" ? conditions.trim() : app.conditions,
      history: [...app.history, { from: app.status, to, at: DEMO_NOW, by: counselorId, reason: note || undefined }],
    });
  };

  return (
    <Sheet open onClose={onClose} title="Change status" description={`Now: ${STATUS_LABEL[app.status]}`}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>Record change</Button></>}>
      {options.length === 0 ? <Note>This application is closed. Nothing further can change.</Note> : (
        <div className="space-y-5">
          <fieldset>
            <legend className="mb-2 text-micro font-medium tracking-wide text-n-400 uppercase">New status <span className="normal-case tracking-normal text-n-500">Only valid next steps are listed</span></legend>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {options.map((s) => (
                <label key={s} className={cx("press flex cursor-pointer items-center gap-2.5 rounded-sm border px-3 py-2 text-sm", to === s ? "border-blue-500 bg-info-tint font-medium text-n-100" : "border-line text-n-300 hover:bg-n-850")}>
                  <input type="radio" name="status" className="accent-blue-500" checked={to === s} onChange={() => pick(s)} />{STATUS_LABEL[s]}
                </label>
              ))}
            </div>
          </fieldset>

          {to && (
            <>
              <Field label="What the student will see" required hint="A simpler wording than the internal status. Edit if the default does not fit."><Input value={label} onChange={(e) => setLabel(e.target.value)} /></Field>
              <Field label="Reason or note" optional={!["withdrawn", "closed", "rejected", "offer_declined"].includes(to)} required={["withdrawn", "closed", "rejected", "offer_declined"].includes(to)}>
                <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
              </Field>

              {to === "conditional_offer_received" && <Field label="Conditions of the offer" required><Textarea rows={3} value={conditions} onChange={(e) => setConditions(e.target.value)} /></Field>}

              {needsOverride && (
                <Note tone="warn" title="The student has not confirmed this application">
                  <p>Wait for their confirmation, or record why you are proceeding without it.</p>
                  <div className="mt-2"><Field label="Why proceed without confirmation" required><Input value={override} onChange={(e) => setOverride(e.target.value)} /></Field></div>
                </Note>
              )}

              {submitting && (
                <div className="space-y-4 rounded-md border border-line bg-raised p-4">
                  <p className="text-sm font-medium text-n-100">Submission evidence</p>
                  <p className="-mt-3 text-tiny text-n-400">Attach the confirmation, or say why none is available. A submission cannot be recorded without one or the other.</p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Date submitted" required><Input type="date" value={submittedOn} max={DEMO_NOW.slice(0, 10)} onChange={(e) => setSubmittedOn(e.target.value)} /></Field>
                    <Field label="Reference from the portal" optional><Input value={ref} onChange={(e) => setRef(e.target.value)} /></Field>
                  </div>
                  <Field label="Confirmation file" optional error={fileError} hint="PDF, JPG or PNG up to 10 MB. Never include portal passwords.">
                    <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) { setFile(null); return; }
                      if (!OK_TYPES.includes(f.type)) { setFileError(`${f.name} is not a PDF, JPG or PNG.`); setFile(null); }
                      else if (f.size > MAX) { setFileError(`${f.name} is over 10 MB.`); setFile(null); }
                      else { setFileError(undefined); setFile({ name: f.name }); }
                    }} />
                  </Field>
                  {!file && <Field label="Or: why no evidence is available" optional><Textarea rows={2} value={noEvidence} onChange={(e) => setNoEvidence(e.target.value)} placeholder="For example: the portal sends no receipt." /></Field>}
                  <p className="text-tiny text-n-500 tabular-nums">{evidenceCount} file{evidenceCount === 1 ? "" : "s"} on record{existingReasons ? " plus a recorded reason" : ""}.</p>
                </div>
              )}
            </>
          )}

          {errors.length > 0 && <Note tone="bad" title="Not saved"><ul className="list-disc pl-4">{errors.map((e) => <li key={e}>{e}</li>)}</ul></Note>}
        </div>
      )}
    </Sheet>
  );
}
