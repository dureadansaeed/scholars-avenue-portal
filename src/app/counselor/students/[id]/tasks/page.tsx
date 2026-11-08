import { Suspense } from "react";
import PortalLoading from "@/components/shell/portal-loading";
import { notFound } from "next/navigation";
import { TaskBoard } from "@/app/counselor/tasks/task-board";
import { getStudentTasksForCounselor } from "@/lib/data/counselor-tasks";
import { getCurrentCounselorId } from "@/lib/session";

export const metadata = { title: "Student tasks" };

async function StudentTasksTabContent({ params }: Pick<PageProps<"/counselor/students/[id]/tasks">, "params">) {
  const { id } = await params;
  const counselorId = await getCurrentCounselorId();
  const data = await getStudentTasksForCounselor(counselorId, id);
  if (!data) notFound();
  return <TaskBoard counselorId={counselorId} tasks={data.tasks} students={[data.student]} fixedStudentId={id} />;
}

// `params` is request-time data, so it is awaited inside a Suspense boundary and the page shell can stream first.
export default function StudentTasksTab(props: Pick<PageProps<"/counselor/students/[id]/tasks">, "params">) {
  return (
    <Suspense fallback={<PortalLoading />}>
      <StudentTasksTabContent {...props} />
    </Suspense>
  );
}
