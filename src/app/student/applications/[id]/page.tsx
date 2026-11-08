import { Suspense } from "react";
import PortalLoading from "@/components/shell/portal-loading";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplicationStatusChip, DocumentStatusChip, SampleTag, Status } from "@/components/ui/chips";
import { Timeline } from "@/components/ui/domain";
import { Icon } from "@/components/ui/icons";
import { PageHead } from "@/components/ui/navigation";
import { Metric, Section } from "@/components/ui/panels";
import { formatDate } from "@/lib/clock";
import { cx } from "@/lib/cx";
import { getStudentApplication } from "@/lib/data/student-journey";
import { flags } from "@/lib/flags";
import { deadlineText, money } from "@/lib/program-format";
import { getCurrentStudentId } from "@/lib/session";
import { STAGES, stageOf } from "@/lib/student-labels";
import { ConfirmCard } from "./confirm-card";

export async function generateMetadata() {
  return { title: "Application" };
}

async function ApplicationPageContent({ params }: Pick<PageProps<"/student/applications/[id]">, "params">) {
  const { id } = await params;
  const studentId = await getCurrentStudentId();
  const app = await getStudentApplication(studentId, id);
  if (!app) notFound();

  const p = app.programme;
  const stage = stageOf(app.status);
  const mine = app.checklist.filter((c) => c.owner === "student");
  const ours = app.checklist.filter((c) => c.owner === "counselor");
  const deadline = deadlineText(p.intake);
  const fee = app.fee ?? (p.intake.applicationFee ? { ...p.intake.applicationFee, paid: false } : null);

  return (
    <>
      <PageHead
        title={`${p.degreeTitle} ${p.name}`}
        description={`${p.university.name}, ${p.city}, ${p.country} · ${p.intake.name}`}
        actions={<><SampleTag /><ApplicationStatusChip status={app.status} label={app.label} /></>}
      />
      <nav aria-label="Breadcrumb" className="-mt-3 mb-5 text-tiny text-n-500">
        <Link href="/student/applications" className="hover:text-n-100">Applications</Link> <span aria-hidden>/</span> <span>{p.name}</span>
      </nav>

      <div className="space-y-4">
        <ol className="flex items-center gap-2 rounded-lg border border-line bg-surface px-5 py-4" aria-label="Application progress">
          {STAGES.map((s, i) => (
            <li key={s} className="flex flex-1 items-center gap-2" aria-current={i === stage ? "step" : undefined}>
              <span className={cx("h-1 flex-1 rounded-full", i <= stage ? "bg-blue-500" : "bg-n-800")} />
              <span className={cx("text-micro tracking-wide uppercase", i === stage ? "font-medium text-n-100" : "text-n-500")}>{s}</span>
            </li>
          ))}
        </ol>

        {app.status === "awaiting_student_confirmation" && flags.requireStudentConfirmation && (
          <ConfirmCard studentId={studentId} applicationId={app.id} programme={`${p.degreeTitle} ${p.name}, ${p.university.name}`}
            route={app.route} fee={money(fee)} intake={p.intake.name} />
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Section title="What needs to happen" description="Steps marked for you need your action. The rest are handled by your counselor." flush>
              <ul className="divide-y divide-line">
                {[...mine, ...ours].map((c) => (
                  <li key={c.id} className="flex items-start gap-3 px-5 py-3">
                    <span className={cx("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border",
                      c.status === "done" ? "border-ok-400 bg-ok-400 text-n-950" : "border-line-strong text-transparent")}><Icon.Check className="size-3" /></span>
                    <span className="min-w-0 flex-1">
                      <span className={cx("block text-sm", c.status === "done" ? "text-n-400" : "text-n-100")}>{c.label}</span>
                      <span className="block text-tiny text-n-500">{c.owner === "student" ? "You" : "Handled by your counselor"}</span>
                    </span>
                    {c.owner === "student" && c.status === "pending" && c.document
                      ? <Link href="/student/documents" className="text-tiny font-medium text-link hover:underline">Upload</Link>
                      : c.document ? <DocumentStatusChip status={c.document} />
                      : <Status tone={c.status === "done" ? "ok" : c.status === "in_review" ? "info" : c.owner === "student" ? "warn" : "neutral"}>
                          {c.status === "done" ? "Done" : c.status === "in_review" ? "In review" : c.owner === "student" ? "Needs you" : "Pending"}
                        </Status>}
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="History">
              <Timeline events={app.events} />
            </Section>
          </div>

          <div className="space-y-4">
            <Section title="Details">
              <dl className="space-y-4">
                <Metric label="How it is submitted" value={<span className="text-base">{app.route}</span>} hint={app.portalName ?? undefined} />
                <Metric label="Deadline" value={<span className={cx("text-base", deadline.unknown && "text-warn-400")}>{deadline.unknown ? "Not published" : deadline.value}</span>}
                  hint={deadline.unknown ? "We will confirm it. Do not assume it is open." : undefined} />
                <Metric label="Reference" value={<span className="text-base">{app.externalRef ?? "Not issued yet"}</span>} hint="Appears once the application is submitted" />
                <Metric label="Application fee" value={<span className="text-base tabular-nums">{money(fee) ?? "Not confirmed"}</span>}
                  hint={fee ? (fee.paid ? "Paid" : "Not paid yet") : undefined} />
                {app.startedAt && <Metric label="Started" value={<span className="text-base tabular-nums">{formatDate(app.startedAt)}</span>} />}
                {app.submittedAt && <Metric label="Submitted" value={<span className="text-base tabular-nums">{formatDate(app.submittedAt)}</span>} />}
              </dl>
            </Section>
            <Section title="Your counselor">
              <p className="text-sm text-n-100">{app.counselorName ?? "Not assigned"}</p>
            </Section>
            <p className="text-tiny leading-relaxed text-n-500">We track and prepare your application. The university makes the admission decision.</p>
          </div>
        </div>
      </div>
    </>
  );
}

// `params` is request-time data, so it is awaited inside a Suspense boundary and the page shell can stream first.
export default function ApplicationPage(props: Pick<PageProps<"/student/applications/[id]">, "params">) {
  return (
    <Suspense fallback={<PortalLoading />}>
      <ApplicationPageContent {...props} />
    </Suspense>
  );
}
