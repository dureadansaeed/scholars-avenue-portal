import { Suspense } from "react";
import PortalLoading from "@/components/shell/portal-loading";
import { notFound } from "next/navigation";
import { getStudentWorkBundle } from "@/lib/data/counselor-work";
import { getStudentHistoryBase } from "@/lib/data/counselor-tasks";
import { getCurrentCounselorId } from "@/lib/session";
import { StudentTimeline } from "./student-timeline";

export const metadata = { title: "Student timeline" };

async function TimelineTabContent({ params }: Pick<PageProps<"/counselor/students/[id]/timeline">, "params">) {
  const { id } = await params;
  const counselorId = await getCurrentCounselorId();
  const [base, work] = await Promise.all([getStudentHistoryBase(counselorId, id), getStudentWorkBundle(counselorId, id)]);
  if (!base || !work) notFound();
  return <StudentTimeline counselorId={counselorId} base={base.events} bundle={work} />;
}

// `params` is request-time data, so it is awaited inside a Suspense boundary and the page shell can stream first.
export default function TimelineTab(props: Pick<PageProps<"/counselor/students/[id]/timeline">, "params">) {
  return (
    <Suspense fallback={<PortalLoading />}>
      <TimelineTabContent {...props} />
    </Suspense>
  );
}
