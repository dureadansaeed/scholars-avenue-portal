import { PageHead } from "@/components/ui/navigation";
import { getStudentTasks } from "@/lib/data/student-journey";
import { getCurrentStudentId } from "@/lib/session";
import { TasksView } from "./tasks-view";

export const metadata = { title: "Tasks" };

export default async function TasksPage() {
  const studentId = await getCurrentStudentId();
  const tasks = await getStudentTasks(studentId);
  return (
    <>
      <PageHead title="Tasks" description="Things your counselor has asked you to do, with the date each is due." />
      <TasksView key={studentId} studentId={studentId} tasks={tasks} />
    </>
  );
}
