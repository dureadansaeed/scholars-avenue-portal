import Link from "next/link";
import { ApplicationStatusChip, SampleTag } from "@/components/ui/chips";
import { Icon } from "@/components/ui/icons";
import { PageHead } from "@/components/ui/navigation";
import { Empty, Section } from "@/components/ui/panels";
import { cx } from "@/lib/cx";
import { getStudentApplications } from "@/lib/data/student-journey";
import { getCurrentStudentId } from "@/lib/session";
import { STAGES, stageOf } from "@/lib/student-labels";

export const metadata = { title: "Applications" };

export default async function ApplicationsPage() {
  const apps = await getStudentApplications(await getCurrentStudentId());
  return (
    <>
      <PageHead title="Applications" description="Where each of your applications stands, and what is waiting on you." actions={<SampleTag />} />
      {apps.length === 0 ? (
        <Section><Empty title="No applications yet">Once you and your counselor agree on programmes, each application will appear here with its own progress.</Empty></Section>
      ) : (
        <ul className="space-y-4">
          {apps.map((a) => {
            const stage = stageOf(a.status);
            const p = a.programme;
            return (
              <li key={a.id}>
                <Link href={`/student/applications/${a.id}`} className="press block rounded-lg border border-line bg-surface p-5 transition-colors hover:border-line-strong">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold tracking-tight text-n-100">{p.degreeTitle} {p.name}</h2>
                      <p className="text-sm text-n-400">{p.university.name}, {p.city} · <span className="tabular-nums">{p.intake.name}</span></p>
                    </div>
                    <ApplicationStatusChip status={a.status} label={a.label} />
                  </div>
                  <ol className="mt-4 flex items-center gap-2" aria-label="Progress">
                    {STAGES.map((s, i) => (
                      <li key={s} className="flex flex-1 items-center gap-2">
                        <span className={cx("h-1 flex-1 rounded-full", i <= stage ? "bg-blue-500" : "bg-n-800")} />
                        <span className={cx("text-micro tracking-wide uppercase", i === stage ? "font-medium text-n-100" : "text-n-500")}>{s}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-tiny text-n-400">
                    <span className="tabular-nums">{a.doneItems} of {a.totalItems} steps done · via {a.route}</span>
                    {a.studentTodo > 0
                      ? <span className="font-medium text-warn-400">{a.studentTodo} {a.studentTodo === 1 ? "step needs" : "steps need"} you</span>
                      : <span className="inline-flex items-center gap-1 text-n-500">Nothing needed from you <Icon.Chevron className="size-3" /></span>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
