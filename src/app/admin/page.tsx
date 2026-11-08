import Link from "next/link";
import { ApplicationStatusChip, RecordStatusChip, Status } from "@/components/ui/chips";
import { PageHead } from "@/components/ui/navigation";
import { Empty, Meter, Metric, Section } from "@/components/ui/panels";
import { STATUS_LABEL } from "@/lib/application-rules";
import { formatDate, relativeDays } from "@/lib/clock";
import { cx } from "@/lib/cx";
import { getAdminOverview } from "@/lib/data/admin";
import { getCurrentAdminId } from "@/lib/session";
import { UnassignedQueue } from "./unassigned-queue";

export const metadata = { title: "Overview" };

const linkCls = "text-tiny font-medium text-link hover:underline";

export default async function AdminOverview() {
  const [o, adminId] = await Promise.all([getAdminOverview(), getCurrentAdminId()]);
  const m = o.metrics;
  const totalApps = o.byGroup.reduce((n, g) => n + g.count, 0);

  return (
    <>
      <PageHead title="Overview" description="Students, cases, counselors and applications across the organisation. Counts are from the records as they stand today." />
      <div className="space-y-4">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border border-line bg-surface p-5 md:grid-cols-4">
          <Metric label="Students" value={m.totalStudents} hint="All accounts with the student role" />
          <Metric label="Active cases" value={m.activeCases} hint="Not completed, cancelled or closed" />
          <Metric label="Unassigned cases" value={<span className={cx(m.unassigned > 0 && "text-warn-400")}>{m.unassigned}</span>} hint={m.unassigned ? "Waiting for a counselor" : "Every case has a counselor"} />
          <Metric label="Active applications" value={m.activeApplications} hint="Before a final outcome" />
        </dl>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Section title="Applications by status" description={`${totalApps} applications, grouped into the common reporting categories.`}>
              <div className="space-y-3">
                {o.byGroup.map((g) => <Meter key={g.group} label={g.label} value={g.count} max={Math.max(totalApps, 1)} tone="neutral" />)}
              </div>
            </Section>

            <Section title="Deadlines" description="Application deadlines in the next 30 days, and any already missed before submission." flush>
              {o.missed.length === 0 && o.approaching.length === 0 ? <Empty title="No application deadlines in the next 30 days" /> : (
                <ul className="divide-y divide-line">
                  {[...o.missed.map((d) => ({ ...d, kind: "missed" as const })), ...o.approaching.map((d) => ({ ...d, kind: "soon" as const }))].map((d) => (
                    <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-n-100">{d.programme}</p>
                        <p className="text-tiny text-n-500">{d.student} · <span className="tabular-nums">{formatDate(d.date)} · {relativeDays(d.date)}</span></p>
                      </div>
                      {d.kind === "missed" ? <Status tone="bad">Missed, not submitted</Status> : <Status tone={d.days <= 7 ? "warn" : "info"}>{d.days} days left</Status>}
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Delayed applications" description="Not yet submitted, and either past the deadline or untouched for three weeks." flush>
              {o.delayed.length === 0 ? <Empty title="Nothing is stalled" /> : (
                <ul className="divide-y divide-line">
                  {o.delayed.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                      <div className="min-w-0"><p className="truncate text-sm text-n-100">{a.student}</p><p className="text-tiny text-n-500">Counselor: {a.counselor ?? "none"}</p></div>
                      <ApplicationStatusChip status={a.status} label={STATUS_LABEL[a.status]} />
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Workload by counselor" description="Active cases against each counselor's limit."
              actions={<Link href="/admin/counselors" className={linkCls}>Manage workload</Link>}>
              <div className="space-y-3">
                {o.workload.map((c) => (
                  <div key={c.id}>
                    <Meter label={`${c.name}${c.absent ? " (away)" : ""}`} value={c.activeCases} max={c.threshold} tone="load" />
                  </div>
                ))}
              </div>
            </Section>
          </div>

          <div className="space-y-4">
            <Section title="Unassigned students" description="Assign a counselor so work can start." flush
              actions={<Link href="/admin/students?view=unassigned" className={linkCls}>All</Link>}>
              <UnassignedQueue adminId={adminId} rows={o.unassignedCases} />
            </Section>

            <Section title="Counselors needing cover" flush>
              {o.coverage.length === 0 ? <Empty title="No coverage problems" /> : (
                <ul className="divide-y divide-line">
                  {o.coverage.map((c) => (
                    <li key={c.id} className="px-5 py-3">
                      <Link href={`/admin/counselors#${c.id}`} className="text-sm font-medium text-n-100 hover:underline">{c.name}</Link>
                      <p className="text-tiny text-warn-400">{c.reason}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Programme data to review" description="Unverified, stale or incomplete catalog records." flush
              actions={<Link href="/admin/catalog?filter=attention" className={linkCls}>Catalog</Link>}>
              {o.staleProgrammes.length === 0 ? <Empty title="All records verified and current" /> : (
                <ul className="divide-y divide-line">
                  {o.staleProgrammes.slice(0, 6).map((p) => (
                    <li key={p.id}>
                      <Link href={`/admin/catalog/programs/${p.id}`} className="block px-5 py-3 transition-colors hover:bg-n-850/70">
                        <span className="flex items-center justify-between gap-2"><span className="truncate text-sm text-n-100">{p.name}</span><RecordStatusChip status={p.status} /></span>
                        <span className="block truncate text-tiny text-n-500">{p.university} · {p.warning}</span>
                      </Link>
                    </li>
                  ))}
                  {o.staleProgrammes.length > 6 && <li className="px-5 py-2.5 text-tiny text-n-500">and {o.staleProgrammes.length - 6} more</li>}
                </ul>
              )}
            </Section>

            <Section title="Overdue tasks" description={`${o.overdueTasks} open past their due date, across all counselors and students.`} flush>
              {o.overdueSample.length === 0 ? <Empty title="Nothing overdue" /> : (
                <ul className="divide-y divide-line">
                  {o.overdueSample.map((t) => (
                    <li key={t.id} className="px-5 py-3">
                      <p className="truncate text-sm text-n-100">{t.title}</p>
                      <p className="text-tiny text-bad-400"><span className="text-n-500">{t.student} · </span><span className="tabular-nums">due {formatDate(t.dueDate)}</span></p>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
        </div>
      </div>
    </>
  );
}
