"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Sheet } from "@/components/ui/overlays";
import { Note } from "@/components/ui/panels";
import { ROUTE_LABEL } from "@/lib/student-labels";
import type { ApplicationRouteType, Program, ProgramIntake } from "@/types";

export interface NewApplication { route: ApplicationRouteType; portalName?: string; portalUrl?: string; note?: string }

/**
 * One application per programme and intake. Warns when it would exceed the
 * package scope (PRD 13.14) and lets the counselor proceed only on purpose.
 */
export function CreateApplication({ program, intake, studentName, existingCount, limit, unconfirmed, onClose, onCreate }: {
  program: Program; intake: ProgramIntake; studentName: string; existingCount: number; limit: number | null; unconfirmed: boolean;
  onClose: () => void; onCreate: (a: NewApplication) => void;
}) {
  const [route, setRoute] = useState<ApplicationRouteType>(intake.route?.type ?? "direct_portal");
  const [portalName, setPortalName] = useState(intake.route?.portalName ?? "");
  const [portalUrl, setPortalUrl] = useState(intake.route?.portalUrl ?? "");
  const [note, setNote] = useState("");
  const [exception, setException] = useState(false);
  const [error, setError] = useState<string>();

  const overScope = limit != null && existingCount >= limit;
  const submit = () => {
    if (overScope && !exception) { setError("This would go beyond the package's application limit. Tick the exception to continue."); return; }
    if (portalUrl && !/^https?:\/\/\S+$/.test(portalUrl)) { setError("Enter the portal address starting with https://"); return; }
    onCreate({ route, portalName: portalName.trim() || undefined, portalUrl: portalUrl.trim() || undefined, note: note.trim() || undefined });
  };

  return (
    <Sheet open onClose={onClose} title="Create application" description={`${program.degreeTitle} ${program.name} · ${intake.name} · ${studentName}`}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={submit}>Create application</Button></>}>
      <div className="space-y-4">
        <Note>This creates a separate application for this programme and intake, with its own checklist. The programme&apos;s requirements as they stand today are saved with it.</Note>
        {unconfirmed && <Note tone="warn" title="The student has not approved this programme yet">Check that they want to apply before you start work on it.</Note>}
        {overScope && (
          <Note tone="warn" title="Over the package limit">{studentName} already has {existingCount} of {limit} applications in their package.
            <div className="mt-2"><Checkbox label="Create it anyway (approved exception)" checked={exception} onChange={(e) => setException(e.target.checked)} /></div></Note>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="How it is submitted" required>
            <Select value={route} onChange={(e) => setRoute(e.target.value as ApplicationRouteType)}>
              {Object.entries(ROUTE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </Field>
          <Field label="Portal or service name" optional><Input value={portalName} onChange={(e) => setPortalName(e.target.value)} /></Field>
        </div>
        <Field label="Portal address" optional hint="Never store a portal password here or in notes."><Input type="url" value={portalUrl} onChange={(e) => setPortalUrl(e.target.value)} placeholder="https://" /></Field>
        <Field label="First note" optional><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        {!intake.route && <Note tone="warn">The application route is not recorded for this intake. Confirm it on the official page.</Note>}
        {error && <Note tone="bad">{error}</Note>}
      </div>
    </Sheet>
  );
}
