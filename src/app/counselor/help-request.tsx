"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/form";
import { Sheet } from "@/components/ui/overlays";
import { Note } from "@/components/ui/panels";
import { useLocalState } from "@/lib/use-local-state";

type Request = { kind: string; detail: string; at: string };

/** Entry point for asking an administrator for reassignment or help (PRD 4.2). Stored locally until a backend exists. */
export function HelpRequest({ counselorId }: { counselorId: string }) {
  const [sent, setSent] = useLocalState<Request[]>(`sa:cns:help:${counselorId}`, []);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("workload");
  const [detail, setDetail] = useState("");
  const [error, setError] = useState<string>();

  const submit = () => {
    if (detail.trim().length < 10) { setError("Add a sentence or two so the administrator knows what you need."); return; }
    setSent((s) => [...s, { kind, detail: detail.trim(), at: new Date().toISOString() }]);
    setOpen(false); setDetail(""); setError(undefined);
  };

  return (
    <div className="space-y-3">
      <Button onClick={() => setOpen(true)}>Ask an administrator for help</Button>
      {sent.length > 0 && <Note tone="ok" title={`${sent.length} request${sent.length > 1 ? "s" : ""} sent`}>An administrator will follow up. In this demo it is stored in your browser only.</Note>}
      <Sheet open={open} onClose={() => setOpen(false)} title="Ask for help" description="Request reassignment of a student, cover while you are away, or a lighter workload."
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" onClick={submit}>Send request</Button></>}>
        <div className="space-y-4">
          <Field label="What do you need?" required>
            <Select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="workload">Workload is too high</option><option value="reassign">Reassign a student</option>
              <option value="cover">Cover while I am away</option><option value="other">Something else</option>
            </Select>
          </Field>
          <Field label="Details" required error={error}><Textarea data-autofocus rows={4} value={detail} onChange={(e) => setDetail(e.target.value)} /></Field>
        </div>
      </Sheet>
    </div>
  );
}
