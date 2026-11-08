"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MatchChip, RecordStatusChip, SampleTag, Status, Tag } from "@/components/ui/chips";
import { CriterionList } from "@/components/ui/domain";
import { Field, Textarea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/overlays";
import { Note } from "@/components/ui/panels";
import { proportionalEstimate } from "@/lib/application-rules";
import { formatDate } from "@/lib/clock";
import { cx } from "@/lib/cx";
import type { MatchDecision } from "@/lib/counselor-work";
import type { StudentFacts } from "@/lib/eligibility";
import { deadlineText, money, requirementRows } from "@/lib/program-format";
import { freshnessWarnings, type BankRow } from "@/lib/program-search";
import { countryName } from "@/mocks/countries";
import type { MatchResult } from "@/types";

function Facts({ rows }: { rows: { label: string; value: string; unknown?: boolean }[] }) {
  return (
    <dl className="divide-y divide-line rounded-md border border-line text-sm">
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between gap-4 px-4 py-2.5">
          <dt className="shrink-0 text-n-400">{r.label}</dt>
          <dd className={cx("text-right", r.unknown ? "text-warn-400" : "text-n-100")}>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ProgramDetail({ row, student, match, facts, decision, onDecide, onClearDecision }: {
  row: BankRow; student?: { id: string; name: string }; match?: MatchResult; facts?: StudentFacts;
  decision?: MatchDecision; onDecide: (d: { decision: "accepted" | "unsuitable"; reason: string }) => void; onClearDecision: () => void;
}) {
  const { program: p, intake: i } = row;
  const warnings = freshnessWarnings(p, i);
  const [deciding, setDeciding] = useState<"accepted" | "unsuitable" | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();

  // Informational only (MAT-012): shown when the grade scales differ and nothing may be compared directly.
  const gradeCrit = match?.criteria.find((c) => c.key === "grade");
  const req = p.requirements.minGrade;
  const basis = facts?.academics.filter((a) => a.gradeObtained != null && a.gradeScale != null).sort((a, b) => (a.level < b.level ? 1 : -1))[0];
  const estimate = gradeCrit?.state === "needs_review" && req.status === "required" && basis && basis.gradeScale !== req.value.scale
    ? proportionalEstimate(basis.gradeObtained!, basis.gradeScale!, req.value.scale) : null;

  const submit = () => {
    if (reason.trim().length < 5) { setError("Record your reason. It is kept apart from the system's result."); return; }
    onDecide({ decision: deciding!, reason: reason.trim() });
    setDeciding(null); setReason(""); setError(undefined);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2"><RecordStatusChip status={p.status} /><SampleTag /><Tag>{countryName(p.countryCode)}</Tag><Tag>{i.name}</Tag></div>

      {warnings.length > 0 && (
        <Note tone="warn" title="Check before relying on this record">
          <ul className="list-disc space-y-0.5 pl-4">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </Note>
      )}

      {student && match && (
        <section aria-label="Match" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-n-100">Match for {student.name}</h3>
            <MatchChip overall={match.overall} />
          </div>
          <CriterionList criteria={match.criteria} />
          <p className="text-tiny leading-relaxed text-n-500">A rule-based check of the records held. It is not an admission decision, and unknown data is never counted as a pass or a fail.</p>

          {estimate && basis && req.status === "required" && (
            <div className="rounded-md border border-line bg-raised p-3 text-tiny leading-relaxed text-n-300">
              <p className="font-medium text-n-100">Grade scale helper (informational)</p>
              <p className="mt-1 tabular-nums">{basis.gradeObtained} / {basis.gradeScale} ≈ <span className="font-medium">{estimate.value} / {req.value.scale}</span> by straight proportion.</p>
              <p className="tabular-nums text-n-500">Formula: {estimate.formula}</p>
              <p className="mt-1 text-n-500">Not an official conversion and not used in the match result. Check how this university assesses grades from {basis.institutionCountry}.</p>
            </div>
          )}

          <div className="rounded-md border border-line p-3">
            <p className="text-micro font-medium tracking-wide text-n-500 uppercase">Your decision</p>
            {decision ? (
              <div className="mt-1.5 space-y-1.5">
                <Status tone={decision.decision === "accepted" ? "ok" : "neutral"}>{decision.decision === "accepted" ? "You accepted this as a potential match" : "You marked this as not suitable"}</Status>
                <p className="text-sm text-n-200">{decision.reason}</p>
                <p className="text-tiny text-n-500">{formatDate(decision.at)} · recorded separately from the system result</p>
                <Button size="sm" variant="ghost" onClick={onClearDecision}>Withdraw decision</Button>
              </div>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => { setDeciding("accepted"); setReason(""); }}>Accept as potential match</Button>
                <Button size="sm" variant="ghost" onClick={() => { setDeciding("unsuitable"); setReason(""); }}>Not suitable</Button>
              </div>
            )}
          </div>
        </section>
      )}

      <section aria-label="Programme" className="space-y-2">
        <h3 className="text-sm font-semibold tracking-tight text-n-100">Programme</h3>
        <Facts rows={[
          { label: "University", value: `${row.university.name}${row.university.type ? ` (${row.university.type})` : ""}` },
          { label: "Where", value: `${row.city.name}, ${countryName(p.countryCode)}` }, { label: "Subject", value: p.subject },
          { label: "Duration", value: p.durationMonths ? `${p.durationMonths} months, ${p.studyMode.replace("_", "-")}` : "Not recorded", unknown: !p.durationMonths },
          { label: "Language of instruction", value: p.languageOfInstruction.join(", ") },
          { label: "Scholarships", value: p.scholarshipAvailable == null ? "Not recorded" : p.scholarshipAvailable ? "Available" : "None known", unknown: p.scholarshipAvailable == null },
        ]} />
      </section>

      <section aria-label="Requirements" className="space-y-2">
        <h3 className="text-sm font-semibold tracking-tight text-n-100">Entry requirements</h3>
        <Facts rows={requirementRows(p)} />
      </section>

      <section aria-label="Intakes" className="space-y-2">
        <h3 className="text-sm font-semibold tracking-tight text-n-100">Intakes, deadlines and fees</h3>
        <ul className="space-y-2">
          {p.intakes.map((x) => {
            const dl = deadlineText(x);
            return (
              <li key={x.id} className={cx("rounded-md border p-3 text-tiny", x.id === i.id ? "border-blue-500 bg-info-tint" : "border-line")}>
                <p className="flex items-center justify-between text-sm font-medium text-n-100">{x.name}{x.id === i.id && <span className="text-tiny font-normal text-n-500">Viewing</span>}</p>
                <dl className="mt-1.5 grid grid-cols-[7rem_1fr] gap-y-1 text-n-300">
                  <dt className="text-n-500">Deadline</dt><dd className={cx(dl.unknown && "text-warn-400")}>{dl.value}{x.deadline.kind === "fixed" && ` (${x.deadline.type.replace("_", "-")})`}</dd>
                  <dt className="text-n-500">Route</dt><dd>{x.route ? `${x.route.portalName ?? ""} ${x.route.type.replace(/_/g, " ")}`.trim() : "Not recorded"}</dd>
                  <dt className="text-n-500">Application fee</dt><dd>{money(x.applicationFee) ?? "Not recorded"}</dd>
                  <dt className="text-n-500">Tuition</dt><dd>{x.tuition ? `${money(x.tuition)} per ${x.tuition.per}` : "Not recorded"}</dd>
                </dl>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-label="Sources" className="space-y-2">
        <h3 className="text-sm font-semibold tracking-tight text-n-100">Sources</h3>
        <div className="rounded-md border border-line p-3 text-tiny text-n-300">
          <p className="flex flex-wrap items-center gap-2">
            {p.source.url ? <a href={p.source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-link hover:underline"><Icon.Link className="size-3" />Official programme page</a> : <span className="text-warn-400">No source URL recorded</span>}
          </p>
          <p className="mt-1 tabular-nums">{p.source.lastCheckedAt ? `Last checked ${formatDate(p.source.lastCheckedAt)}` : "Never checked"} · {p.status.replace(/_/g, " ")}</p>
        </div>
        {p.counselorNote && <Note title="Counselor note (staff only)">{p.counselorNote}</Note>}
        {p.studentNote && <Note title="Text students may see">{p.studentNote}</Note>}
      </section>

      <Sheet open={!!deciding} onClose={() => setDeciding(null)} title={deciding === "accepted" ? "Accept as potential match" : "Mark as not suitable"}
        description="Your call, recorded with your reason. It does not change the system's match result."
        footer={<><Button variant="ghost" onClick={() => setDeciding(null)}>Cancel</Button><Button variant="primary" onClick={submit}>Save decision</Button></>}>
        <Field label="Reason" required error={error}><Textarea data-autofocus rows={4} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      </Sheet>
    </div>
  );
}
