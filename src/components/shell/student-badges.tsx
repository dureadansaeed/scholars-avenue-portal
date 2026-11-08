import { getStudentBadgeInputs } from "@/lib/data/student-journey";
import { getCurrentStudentId } from "@/lib/session";
import { StudentBadgeSync } from "./student-badge-sync";

// Reads the request cookie, so it renders inside a <Suspense> boundary.
export async function StudentBadges() {
  const studentId = await getCurrentStudentId();
  const inputs = await getStudentBadgeInputs(studentId);
  return <StudentBadgeSync studentId={studentId} {...inputs} />;
}
