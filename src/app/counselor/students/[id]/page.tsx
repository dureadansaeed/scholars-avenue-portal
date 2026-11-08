import { Suspense } from "react";
import PortalLoading from "@/components/shell/portal-loading";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Status, Tag } from "@/components/ui/chips";
import { Icon } from "@/components/ui/icons";
import { Metric, Note, ScoreRing, Section } from "@/components/ui/panels";
import { formatDate } from "@/lib/clock";
import { getStudentWorkspace } from "@/lib/data/counselor";
import { getCurrentCounselorId } from "@/lib/session";
import { countryName } from "@/mocks/countries";
import { GapsPanel } from "./gaps-panel";

export const metadata = { title: "Student" };

async function StudentOverviewContent({ params }: Pick<PageProps<"/counselor/students/[id]">, "params">) {
  const { id } = await params;
  const w = await getStudentWorkspace(await getCurrentCounselorId(), id);
  if (!w) notFound();
  const p = w.preference;
  const base = `/counselor/students/${id}`;

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border border-line bg-surface p-5 md:grid-cols-4">
        <Metric label="Profile" value={`${w.gaps.completion}%`} hint={w.gaps.missing.length ? `${w.gaps.missing.length} items missing` : "Complete"} />
        <Metric label="Documents to review" value={w.gaps.awaitingReview} hint="Uploaded or under review" />
        <Metric label="Open tasks" value={w.openTasks} hint="Including student actions" />
        <Metric label="Applications" value={w.applications} hint={w.applications ? "Tracked in the Applications tab (soon)" : "None yet"} />
      </dl>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <GapsPanel gaps={w.gaps} studentId={id} />

          <Section title="Study preferences" description="What the student has asked for."
            actions={<Link href={`${base}/profile`} className="text-tiny font-medium text-link hover:underline">Review profile</Link>}>
            {p && (p.countries.length || p.degreeLevels.length || p.subjects.length) ? (
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Metric label="Countries" value={<span className="text-base">{p.countries.length ? p.countries.map(countryName).join(", ") : "Not chosen"}</span>} />
                <Metric label="Degree" value={<span className="text-base">{p.degreeLevels.length ? p.degreeLevels.join(", ") : "Not chosen"}</span>} />
                <Metric label="Subjects" value={<span className="text-base">{p.subjects.length ? p.subjects.join(", ") : "Not chosen"}</span>} />
                <Metric label="Intake" value={<span className="text-base">{p.intake ?? "Not chosen"}</span>} />
                <Metric label="Budget" value={<span className="text-base tabular-nums">{p.tuitionMax ? `${p.tuitionMax.amount} ${p.tuitionMax.currency} per year` : "No limit stated"}</span>} />
                <Metric label="Scholarships" value={<span className="text-base">{p.scholarshipInterest ? "Interested" : "Not interested"}</span>} />
              </dl>
            ) : <p className="text-sm text-n-400">The student has not set preferences yet. Without them there is nothing to match programmes against.</p>}
          </Section>
        </div>

        <div className="space-y-4">
          <Section title="Case">
            <div className="flex items-center gap-4">
              <ScoreRing value={w.gaps.completion} size={64} stroke={5} label={`Profile ${w.gaps.completion}% complete`} />
              <div className="min-w-0 text-tiny text-n-400">
                <p>Counselor: <span className="text-n-100">{w.owner?.name ?? "Unassigned"}</span></p>
                <p className="tabular-nums">Opened {formatDate(w.case.createdAt)}</p>
                <p className="tabular-nums">{w.case.activatedAt ? `Activated ${formatDate(w.case.activatedAt)}` : "Not activated"}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {w.case.intake && <Tag>{w.case.intake}</Tag>}
              <Status tone={w.case.paymentConfirmed ? "ok" : "warn"}>{w.case.paymentConfirmed ? "Payment confirmed" : "Payment not confirmed"}</Status>
            </div>
          </Section>

          <Section title={<span className="inline-flex items-center gap-1.5"><Icon.Lock className="size-3.5" />Internal note</span>} description="Only staff see this. It is never shown to the student.">
            {w.case.internalNote ? <p className="text-sm leading-relaxed text-n-200">{w.case.internalNote}</p> : <p className="text-sm text-n-500">No internal note.</p>}
          </Section>

          {w.row.access === "shared" && <Note title="Shared case">{w.owner?.name} owns this case and shared it with you. Ask them before changing its status.</Note>}
        </div>
      </div>
    </div>
  );
}

// `params` is request-time data, so it is awaited inside a Suspense boundary and the page shell can stream first.
export default function StudentOverview(props: Pick<PageProps<"/counselor/students/[id]">, "params">) {
  return (
    <Suspense fallback={<PortalLoading />}>
      <StudentOverviewContent {...props} />
    </Suspense>
  );
}
