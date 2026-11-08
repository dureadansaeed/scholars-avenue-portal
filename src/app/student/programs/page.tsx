import { PageHead } from "@/components/ui/navigation";
import { getStudentProgrammes } from "@/lib/data/student-journey";
import { getCurrentStudentId } from "@/lib/session";
import { ProgrammesView } from "./programmes-view";

export const metadata = { title: "Programmes" };

export default async function ProgrammesPage() {
  const studentId = await getCurrentStudentId();
  const items = await getStudentProgrammes(studentId);
  return (
    <>
      <PageHead title="Programmes" description="Programmes your counselor has shared with you. Tell us which ones you like. For questions, message your counselor on WhatsApp; nothing is submitted without your agreement." />
      <ProgrammesView key={studentId} studentId={studentId} items={items} />
    </>
  );
}
