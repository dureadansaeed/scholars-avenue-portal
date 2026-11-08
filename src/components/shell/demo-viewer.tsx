import { listDemoStudents } from "@/lib/data/student";
import { getCurrentStudentId } from "@/lib/session";
import { StudentSwitcher } from "./student-switcher";

// Reads the request cookie, so it must render inside a <Suspense> boundary.
export async function DemoViewer() {
  const [current, students] = await Promise.all([getCurrentStudentId(), listDemoStudents()]);
  return <StudentSwitcher current={current} students={students} />;
}
