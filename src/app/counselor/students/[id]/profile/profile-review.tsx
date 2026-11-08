"use client";

import { useState } from "react";
import { LEVEL_LABEL, TEST_LABEL, maskSensitive } from "@/app/student/profile/profile-utils";
import { Button } from "@/components/ui/button";
import { Status, Tag, VerificationBadge } from "@/components/ui/chips";
import { Field, Textarea } from "@/components/ui/form";
import { Sheet } from "@/components/ui/overlays";
import { Note, Section } from "@/components/ui/panels";
import { daysUntil, formatDate } from "@/lib/clock";
import { cx } from "@/lib/cx";
import { countryName } from "@/mocks/countries";
import type { AcademicRecord, FieldReview, LanguageTest, OtherTest, StudentPreference, StudentProfile } from "@/types";
import { useReviewOverlay } from "../review-state";

interface Data {
  profile: StudentProfile; academics: AcademicRecord[]; languageTests: LanguageTest[]; otherTests: OtherTest[];
  preference: StudentPreference | null; reviewerNames: Record<string, string>;
}

const FIELDS: { key: keyof StudentProfile & string; label: string; sensitive?: boolean }[] = [
  { key: "fullName", label: "Full legal name" }, { key: "dateOfBirth", label: "Date of birth", sensitive: true },
  { key: "nationality", label: "Nationality" }, { key: "countryOfResidence", label: "Country of residence" }, { key: "city", label: "City" },
  { key: "phone", label: "Primary phone" }, { key: "address", label: "Address" }, { key: "passportNumber", label: "Passport number", sensitive: true },
];

export function ProfileReview({ counselorId, studentId, data }: { counselorId: string; studentId: string; data: Data }) {
  const r = useReviewOverlay(studentId, counselorId);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [correcting, setCorrecting] = useState<{ key: string; label: string; base?: FieldReview } | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();

  const effective = (key: string, base: FieldReview | undefined): FieldReview => r.overlay.reviews[key] ?? base ?? { status: "unverified" };
  const nameOf = (id?: string) => (id ? data.reviewerNames[id] ?? id : undefined);

  const p = data.profile;
  const items: { key: string; base: FieldReview | undefined; has: boolean }[] = [
    ...FIELDS.map((f) => ({ key: `field:${f.key}`, base: p.review[f.key], has: !!p[f.key] })),
    ...data.academics.map((a) => ({ key: `academic:${a.id}`, base: a.review, has: true })),
    ...data.languageTests.map((t) => ({ key: `lang:${t.id}`, base: t.review, has: true })),
    ...data.otherTests.map((t) => ({ key: `other:${t.id}`, base: t.review, has: true })),
  ];
  const outstanding = items.filter((i) => i.has && effective(i.key, i.base).status === "unverified").length;

  const submit = () => {
    if (!correcting) return;
    if (reason.trim().length < 5) { setError("Say what the student needs to fix. They will see this."); return; }
    r.review(correcting.key, correcting.label, "correction_requested", correcting.base, reason.trim());
    setCorrecting(null); setReason(""); setError(undefined);
  };

  const Controls = ({ k, label, base }: { k: string; label: string; base: FieldReview | undefined }) => {
    const e = effective(k, base);
    return (
      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        {e.status !== "verified" && <Button size="sm" onClick={() => r.review(k, label, "verified", base)}>Verify</Button>}
        {e.status !== "correction_requested" && <Button size="sm" variant="ghost" onClick={() => { setCorrecting({ key: k, label, base }); setReason(""); setError(undefined); }}>Request correction</Button>}
        {(r.overlay.reviews[k]) && <Button size="sm" variant="ghost" onClick={() => r.resetReview(k, label)}>Undo</Button>}
      </div>
    );
  };
  const Review = ({ k, base }: { k: string; base: FieldReview | undefined }) => {
    const e = effective(k, base);
    const by = nameOf(e.reviewedBy);
    return (
      <div className="mt-1.5 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <VerificationBadge status={e.status} />
          {e.reviewedAt && e.status !== "unverified" && <span className="text-tiny text-n-500">{by ? `${by}, ` : ""}{formatDate(e.reviewedAt)}</span>}
        </div>
        {e.status === "correction_requested" && e.note && <p className="text-tiny leading-relaxed text-bad-400">Asked: {e.note}</p>}
        {e.previousValues?.length ? (
          <details className="text-tiny text-n-400">
            <summary className="cursor-pointer text-n-500 hover:text-n-100">Earlier values ({e.previousValues.length})</summary>
            <ul className="mt-1">{e.previousValues.map((v) => <li key={v.changedAt + v.value} className="tabular-nums">{v.value} · replaced {formatDate(v.changedAt)}</li>)}</ul>
          </details>
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Note tone={outstanding ? "info" : "ok"} title={outstanding ? `${outstanding} item${outstanding > 1 ? "s" : ""} still to review` : "Everything on file has been reviewed"}>
        Verify what matches the documents, or ask the student to correct it with a reason. Changes to a verified item send it back here.
      </Note>

      <Section title="Personal details" flush>
        <ul className="divide-y divide-line">
          {FIELDS.map((f) => {
            const raw = p[f.key] as string | undefined;
            const key = `field:${f.key}`;
            const open = revealed[f.key];
            return (
              <li key={f.key} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="text-micro font-medium tracking-wide text-n-500 uppercase">{f.label}{f.sensitive && <span className="ml-1.5 normal-case tracking-normal text-n-500">Restricted</span>}</p>
                  {raw ? (
                    <p className="mt-0.5 flex items-center gap-2 text-sm text-n-100 tabular-nums">
                      {f.sensitive && !open ? maskSensitive(raw) : raw}
                      {f.sensitive && (
                        <button type="button" className="text-tiny font-medium text-link hover:underline" aria-label={`${open ? "Hide" : "Show"} ${f.label}`}
                          onClick={() => { setRevealed((x) => ({ ...x, [f.key]: !open })); if (!open) r.logOnly(`Viewed ${f.label.toLowerCase()}`); }}>
                          {open ? "Hide" : "Show"}
                        </button>
                      )}
                    </p>
                  ) : <p className="mt-0.5 text-sm text-n-500">Not provided</p>}
                  {raw && <Review k={key} base={p.review[f.key]} />}
                </div>
                {raw && <Controls k={key} label={f.label.toLowerCase()} base={p.review[f.key]} />}
              </li>
            );
          })}
          <li className="px-5 py-3.5">
            <p className="text-micro font-medium tracking-wide text-n-500 uppercase">Emergency contact <span className="ml-1.5 normal-case tracking-normal">Restricted</span></p>
            {p.emergencyContact ? (
              <p className="mt-0.5 text-sm text-n-100">
                {revealed.ec ? `${p.emergencyContact.name} (${p.emergencyContact.relation}), ${p.emergencyContact.phone}` : "•••••••••"}
                <button type="button" className="ml-2 text-tiny font-medium text-link hover:underline"
                  onClick={() => { setRevealed((x) => ({ ...x, ec: !x.ec })); if (!revealed.ec) r.logOnly("Viewed emergency contact"); }}>{revealed.ec ? "Hide" : "Show"}</button>
              </p>
            ) : <p className="mt-0.5 text-sm text-n-500">Not provided</p>}
          </li>
        </ul>
      </Section>

      <Section title="Academic records" description="Grade and scale are shown together and never converted." flush>
        {data.academics.length === 0 ? <p className="px-5 py-6 text-sm text-n-500">No academic records. The student needs to add at least one before programmes can be matched.</p> : (
          <ul className="divide-y divide-line">
            {data.academics.map((a) => (
              <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-n-100">{a.title}</p>
                  <p className="text-tiny text-n-400">{a.institution}, {a.institutionCountry}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Tag>{LEVEL_LABEL[a.level]}</Tag>
                    {a.gradeObtained != null && a.gradeScale != null
                      ? <Tag className="tabular-nums">{a.gradeObtained} / {a.gradeScale} ({a.gradeKind === "percentage" ? "percentage" : "CGPA"})</Tag>
                      : <Status tone="warn">Grade or scale missing</Status>}
                    <Tag>{a.awardStatus.replace(/_/g, " ")}</Tag>
                    {a.backlogs != null && a.backlogs > 0 && <Status tone="warn">{a.backlogs} backlog{a.backlogs > 1 ? "s" : ""}</Status>}
                    {a.endDate && <Tag className="tabular-nums">{a.endIsExpected ? "Expected" : "Completed"} {formatDate(a.endDate)}</Tag>}
                  </div>
                  {a.gapNote && <p className="mt-1.5 text-tiny text-n-400">Note: {a.gapNote}</p>}
                  <Review k={`academic:${a.id}`} base={a.review} />
                </div>
                <Controls k={`academic:${a.id}`} label={`${a.title}`} base={a.review} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Language tests" description="Exact scores. Tests are never treated as equivalent to each other." flush>
        {data.languageTests.length === 0 ? <p className="px-5 py-6 text-sm text-n-500">No language test on file.</p> : (
          <ul className="divide-y divide-line">
            {data.languageTests.map((t) => {
              const d = t.expiresOn ? daysUntil(t.expiresOn) : null;
              return (
                <li key={t.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-n-100">{TEST_LABEL[t.type]} <span className="font-normal tabular-nums text-n-400">· {t.overall ?? "no score"}{t.maxScore ? ` / ${t.maxScore}` : ""}</span></p>
                    <p className="text-tiny tabular-nums text-n-400">{(["listening", "reading", "writing", "speaking"] as const).filter((k) => t.components[k] != null).map((k) => `${k.slice(0, 1).toUpperCase()} ${t.components[k]}`).join(" · ") || "No component scores"}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Tag className="tabular-nums">Taken {formatDate(t.testDate)}</Tag>
                      {t.expiresOn && (d! < 0 ? <Status tone="bad">Expired {formatDate(t.expiresOn)}</Status> : d! <= 90 ? <Status tone="warn">Expires in {d} days</Status> : <Tag className="tabular-nums">Valid until {formatDate(t.expiresOn)}</Tag>)}
                      {!t.expiresOn && <Tag>No expiry recorded</Tag>}
                    </div>
                    <Review k={`lang:${t.id}`} base={t.review} />
                  </div>
                  <Controls k={`lang:${t.id}`} label={`${TEST_LABEL[t.type]} result`} base={t.review} />
                </li>
              );
            })}
          </ul>
        )}
        {data.otherTests.length > 0 && (
          <ul className="divide-y divide-line border-t border-line">
            {data.otherTests.map((t) => (
              <li key={t.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-n-100">{TEST_LABEL[t.type]} <span className="font-normal tabular-nums text-n-400">· {t.cefr ?? `${t.score}${t.maxScore ? ` / ${t.maxScore}` : ""}`}</span></p>
                  <Tag className="mt-1.5 tabular-nums">Taken {formatDate(t.testDate)}</Tag>
                  <Review k={`other:${t.id}`} base={t.review} />
                </div>
                <Controls k={`other:${t.id}`} label={`${TEST_LABEL[t.type]} result`} base={t.review} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Preferences" description="Read-only: the student sets these.">
        {data.preference && (data.preference.countries.length || data.preference.subjects.length) ? (
          <p className="text-sm leading-relaxed text-n-200">
            {data.preference.countries.map(countryName).join(", ") || "No country chosen"} · {data.preference.degreeLevels.join(", ") || "no degree level"} · {data.preference.subjects.join(", ") || "no subject"} · {data.preference.intake ?? "no intake"}
          </p>
        ) : <p className="text-sm text-n-500">Not set.</p>}
      </Section>

      <Section title="Review activity" description="Your decisions on this record. In a live system these go to the audit log." >
        {r.overlay.log.length === 0 ? <p className="text-sm text-n-500">No decisions recorded yet.</p> : (
          <ul className="space-y-1.5">
            {r.overlay.log.slice(0, 12).map((l, i) => (
              <li key={i} className="flex gap-3 text-tiny"><time className="shrink-0 tabular-nums text-n-500">{formatDate(l.at)}</time><span className={cx("text-n-300")}>{l.text}</span></li>
            ))}
          </ul>
        )}
      </Section>

      <Sheet open={!!correcting} onClose={() => setCorrecting(null)} title="Request a correction" description={correcting ? `Tell the student what to fix on: ${correcting.label}` : undefined}
        footer={<><Button variant="ghost" onClick={() => setCorrecting(null)}>Cancel</Button><Button variant="primary" onClick={submit}>Send request</Button></>}>
        <Field label="What needs fixing" required error={error} hint="The student sees this exactly as written. Keep it specific and polite.">
          <Textarea data-autofocus rows={4} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </Sheet>
    </div>
  );
}
