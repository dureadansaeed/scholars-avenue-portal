import Link from "next/link";
import { Status } from "@/components/ui/chips";
import { Icon } from "@/components/ui/icons";
import { Section } from "@/components/ui/panels";
import { formatDate } from "@/lib/clock";
import type { studentGaps } from "@/lib/data/counselor";

type Gaps = ReturnType<typeof studentGaps>;

function Row({ tone, label, children, href }: { tone: "bad" | "warn" | "neutral" | "info"; label: string; children: React.ReactNode; href?: string }) {
  return (
    <li className="flex items-start gap-3 px-5 py-3">
      <Status tone={tone} className="mt-0.5 shrink-0">{label}</Status>
      <span className="min-w-0 flex-1 text-sm text-n-200">{children}</span>
      {href && <Link href={href} className="shrink-0 text-tiny font-medium text-link hover:underline">Open</Link>}
    </li>
  );
}

/**
 * What stops this record from being ready: missing, incomplete, expired or
 * unverified. Everything is explicit, and "unknown" is never read as fine.
 */
export function GapsPanel({ gaps, studentId }: { gaps: Gaps; studentId: string }) {
  const base = `/counselor/students/${studentId}`;
  const clear = !gaps.missing.length && !gaps.unverified && !gaps.expiredTests.length && !gaps.expiringTests.length && !gaps.expiredDocs.length && !gaps.corrections.length;
  return (
    <Section title="Gaps in this record" description="Missing, incomplete, expired or unverified information." flush>
      {clear ? (
        <p className="flex items-center gap-2 px-5 py-4 text-sm text-ok-400"><Icon.CheckCircle className="size-4" />Nothing is missing or waiting.</p>
      ) : (
        <ul className="divide-y divide-line">
          {gaps.expiredTests.map((t) => <Row key={t.id} tone="bad" label="Expired" href={`${base}/profile`}>{t.label} test expired {formatDate(t.expiresOn)}</Row>)}
          {gaps.expiredDocs.map((d) => <Row key={d.id} tone="bad" label="Expired" href={`${base}/documents`}>{d.label}</Row>)}
          {gaps.expiringTests.map((t) => <Row key={t.id} tone="warn" label="Expiring" href={`${base}/profile`}>{t.label} test expires {formatDate(t.expiresOn)} ({t.days} days). Check it outlasts the deadlines.</Row>)}
          {gaps.corrections.length > 0 && <Row tone="warn" label="Correction open" href={`${base}/profile`}>Waiting for the student to fix: {gaps.corrections.join(", ")}</Row>}
          {gaps.missing.map((m) => <Row key={m.section + m.item} tone="neutral" label="Missing" href={m.href.startsWith("/student/documents") ? `${base}/documents` : `${base}/profile`}><span className="text-n-400">{m.section}: </span>{m.item}</Row>)}
          {gaps.unverified > 0 && <Row tone="info" label="Unverified" href={`${base}/profile`}>{gaps.unverified} profile item{gaps.unverified > 1 ? "s" : ""} not yet reviewed</Row>}
        </ul>
      )}
    </Section>
  );
}
