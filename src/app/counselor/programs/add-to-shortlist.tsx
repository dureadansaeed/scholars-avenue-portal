"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/form";
import { Sheet } from "@/components/ui/overlays";
import { Note } from "@/components/ui/panels";
import type { BankRow } from "@/lib/program-search";
import type { MatchResult, ShortlistEntry } from "@/types";

export interface ShortlistDraft { reason: string; counselorNote?: string; studentNote?: string; duplicateReason?: string }

/** Adds a programme intake to one student's shortlist. A duplicate needs an explicit justification (SHL-010). */
export function AddToShortlist({ row, studentName, match, existing, onClose, onAdd }: {
  row: BankRow | null; studentName: string; match?: MatchResult; existing?: ShortlistEntry; onClose: () => void; onAdd: (d: ShortlistDraft) => void;
}) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [studentNote, setStudentNote] = useState("");
  const [dupe, setDupe] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const open = !!row;
  const concerns = match?.criteria.filter((c) => c.state !== "meets" && c.state !== "not_applicable") ?? [];
  const prefill = concerns.length ? `System checks needing attention:\n${concerns.map((c) => `- ${c.label}: ${c.reason}`).join("\n")}` : "";

  const submit = () => {
    const e: Record<string, string> = {};
    if (reason.trim().length < 5) e.reason = "Record why this programme is worth considering.";
    if (existing && dupe.trim().length < 5) e.dupe = "This is already on the shortlist. Say why you are adding it again.";
    setErrors(e);
    if (Object.keys(e).length) return;
    onAdd({ reason: reason.trim(), counselorNote: (note || prefill).trim() || undefined, studentNote: studentNote.trim() || undefined, duplicateReason: existing ? dupe.trim() : undefined });
    setReason(""); setNote(""); setStudentNote(""); setDupe("");
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add to shortlist" description={row ? `${row.program.degreeTitle} ${row.program.name}, ${row.university.name} · ${row.intake.name}` : undefined}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={submit}>{existing ? "Add anyway" : "Add to shortlist"}</Button></>}>
      <div className="space-y-4">
        <p className="text-sm text-n-300">For <span className="font-medium text-n-100">{studentName}</span>. It starts as an internal proposal; the student only sees it once you share it.</p>
        {existing && <Note tone="warn" title="Already on this student's shortlist">A {existing.status.replace(/_/g, " ")} entry exists for the same programme and intake. Add a second one only for a good reason.</Note>}
        {existing && <Field label="Why add it again?" required error={errors.dupe}><Textarea rows={2} value={dupe} onChange={(e) => setDupe(e.target.value)} /></Field>}
        <Field label="Why this programme" required error={errors.reason} hint="Your reasoning, kept in the history."><Textarea data-autofocus rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        <Field label="Eligibility notes (staff only)" optional hint={prefill ? "Pre-filled from the match result. Edit freely." : undefined}>
          <Textarea rows={prefill ? 5 : 2} value={note || prefill} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <Field label="Note for the student" optional hint="Shown to the student once shared. Keep it free of internal remarks."><Textarea rows={2} value={studentNote} onChange={(e) => setStudentNote(e.target.value)} /></Field>
      </div>
    </Sheet>
  );
}
