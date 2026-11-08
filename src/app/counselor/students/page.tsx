import { PageHead } from "@/components/ui/navigation";
import { listCounselorStudents } from "@/lib/data/counselor";
import { getCurrentCounselorId } from "@/lib/session";
import { StudentsTable } from "./students-table";

export const metadata = { title: "My students" };

export default async function StudentsPage() {
  const counselorId = await getCurrentCounselorId();
  const rows = await listCounselorStudents(counselorId);
  return (
    <>
      <PageHead title="My students" description="Everyone assigned to you, and cases shared with you. Search, filter and open a student to review their record." />
      <StudentsTable key={counselorId} rows={rows} />
    </>
  );
}
