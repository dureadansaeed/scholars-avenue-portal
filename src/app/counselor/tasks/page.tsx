import { PageHead } from "@/components/ui/navigation";
import { getCounselorTasks } from "@/lib/data/counselor-tasks";
import { getCurrentCounselorId } from "@/lib/session";
import { TaskBoard } from "./task-board";

export const metadata = { title: "Tasks" };

export default async function TasksPage() {
  const counselorId = await getCurrentCounselorId();
  const { tasks, students } = await getCounselorTasks(counselorId);
  return (
    <>
      <PageHead title="Tasks" description="Your own tasks and the actions you have asked students to take. Overdue ones come first in every view." />
      <TaskBoard key={counselorId} counselorId={counselorId} tasks={tasks} students={students} />
    </>
  );
}
