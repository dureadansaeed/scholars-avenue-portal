import Link from "next/link";
import { Status } from "@/components/ui/chips";
import { Icon } from "@/components/ui/icons";
import { PageHead } from "@/components/ui/navigation";
import { Empty, Meter, Metric, Note, Section } from "@/components/ui/panels";
import { formatDate, relativeDays } from "@/lib/clock";
import { cx } from "@/lib/cx";
import { getCounselorDashboard } from "@/lib/data/counselor";
import { getCurrentCounselorId } from "@/lib/session";
import { HelpRequest } from "./help-request";

export const metadata = { title: "Dashboard" };

const KIND = {
  task: { label: "Task", tone: "info" }, chase: { label: "Waiting on student", tone: "warn" },
  deadline: { label: "Deadline", tone: "bad" }, upload: { label: "To review", tone: "accent" },
} as const;

export default async function CounselorDashboard() {
  const d = await getCounselorDashboard(await getCurrentCounselorId());
  const { metrics: m, today, attention, counselor } = d;

  return (
    <>
      <PageHead title={`Hello, ${counselor.name.split(" ")[0]}`} description="What needs you today, and how your caseload looks." />
      <div className="space-y-4">
        {counselor.absent && <Note tone="warn" title="You are marked as away">New students will not be assigned to you. Existing cases still need cover; ask an administrator for help below.</Note>}

        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border border-line bg-surface p-5 md:grid-cols-4">
          <Metric label="Your students" value={m.assigned} hint={m.shared ? `+ ${m.shared} shared with you` : "Assigned to you"} />
          <Metric label="Active applications" value={m.activeApplications} hint="Across your students" />
          <Metric label="Waiting for your review" value={m.pendingReviews + m.unverifiedItems} hint={`${m.pendingReviews} documents · ${m.unverifiedItems} profile items`} />
          <Metric label="Overdue tasks" value={<span className={cx(m.overdueTasks > 0 && "text-bad-400")}>{m.overdueTasks}</span>} hint="Yours, and student actions you set" />
        </dl>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Section title="Today" description="Overdue first, then what is coming up in the next week or so." flush>
              {today.length === 0 ? <Empty title="Nothing urgent">New uploads, deadlines and due tasks will show up here.</Empty> : (
                <ul className="divide-y divide-line">
                  {today.map((t) => (
                    <li key={`${t.kind}-${t.id}`}>
                      <Link href={`/counselor/students/${t.studentId}${t.kind === "upload" ? "/documents" : ""}`}
                        className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-n-850/70">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-n-100">{t.title}</span>
                          <span className="block truncate text-tiny text-n-500">
                            <span className="text-n-400">{t.student}</span> · <span className="tabular-nums">{t.kind === "upload" ? `Uploaded ${formatDate(t.date)}` : `Due ${formatDate(t.date)} · ${relativeDays(t.date)}`}</span>
                          </span>
                        </span>
                        {t.overdue ? <Status tone="bad">Overdue</Status> : <Status tone={KIND[t.kind].tone}>{KIND[t.kind].label}</Status>}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Students needing attention" description="Corrections waiting, test reports expiring, or documents to review." flush
              actions={<Link href="/counselor/students" className="text-tiny font-medium text-link hover:underline">All students</Link>}>
              {attention.length === 0 ? <Empty title="No students need attention" /> : (
                <ul className="divide-y divide-line">
                  {attention.map((s) => (
                    <li key={s.id}>
                      <Link href={`/counselor/students/${s.id}`} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 transition-colors hover:bg-n-850/70">
                        <span className="text-sm font-medium text-n-100">{s.name}</span>
                        <span className="flex flex-wrap gap-1.5">
                          {s.awaitingReview > 0 && <Status tone="info">{s.awaitingReview} to review</Status>}
                          {s.corrections > 0 && <Status tone="warn">{s.corrections} correction{s.corrections > 1 ? "s" : ""} open</Status>}
                          {s.testAlert && <Status tone={s.testAlert === "expired" ? "bad" : "warn"}>Test {s.testAlert}</Status>}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>

          <div className="space-y-4">
            <Section title="Your workload" description="Active cases against the limit an administrator set for you.">
              <Meter label="Active students" value={m.ownActive} max={counselor.threshold} tone="load" />
              {m.ownActive >= counselor.threshold * 0.8 && <p className="mt-2 flex items-center gap-1.5 text-tiny text-warn-400"><Icon.Alert className="size-3.5" />You are near your limit.</p>}
              <div className="mt-4"><HelpRequest counselorId={counselor.id} /></div>
            </Section>
          </div>
        </div>
      </div>
    </>
  );
}
