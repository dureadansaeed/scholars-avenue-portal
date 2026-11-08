"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/form";
import { Sheet } from "@/components/ui/overlays";
import { Note } from "@/components/ui/panels";
import { formatDate } from "@/lib/clock";
import { useLocalState } from "@/lib/use-local-state";

/** Acknowledge-before-submit step (PRD 16.18). Behind `flags.requireStudentConfirmation`. */
export function ConfirmCard({ studentId, applicationId, programme, route, fee, intake }: {
  studentId: string; applicationId: string; programme: string; route: string; fee: string | null; intake: string;
}) {
  const [confirmed, setConfirmed, ready] = useLocalState<string | null>(`sa:confirm:${studentId}:${applicationId}`, null);
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);

  if (confirmed) {
    return <Note tone="ok" title="You confirmed this application">
      You agreed on {formatDate(confirmed)}. Your counselor will submit it through {route} and tell you when it is done.</Note>;
  }
  return (
    <>
      <Note tone="warn" title="Please confirm before we submit"
        action={<Button size="sm" variant="primary" disabled={!ready} onClick={() => setOpen(true)}>Review and confirm</Button>}>
        We will not submit this application until you agree. It only takes a minute.
      </Note>
      <Sheet open={open} onClose={() => setOpen(false)} title="Confirm your application" description="Check these details, then confirm."
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Not yet</Button>
          <Button variant="primary" disabled={!agreed} onClick={() => { setConfirmed(new Date().toISOString()); setOpen(false); }}>Confirm</Button></>}>
        <div className="space-y-4">
          <dl className="divide-y divide-line rounded-md border border-line text-sm">
            {[["Programme", programme], ["Intake", intake], ["Submitted through", route], ["Application fee", fee ?? "Not confirmed"]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-4 py-2.5"><dt className="text-n-400">{k}</dt><dd className="text-right text-n-100">{v}</dd></div>
            ))}
          </dl>
          <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
            label="The documents and details I gave are accurate, and I want Scholars Avenue to submit this application."
            hint="Submitting does not guarantee admission; the university decides." />
        </div>
      </Sheet>
    </>
  );
}
