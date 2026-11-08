import { PageHead } from "@/components/ui/navigation";
import { getStudentDocuments } from "@/lib/data/student";
import { getCurrentStudentId } from "@/lib/session";
import { DocumentsView } from "./documents-view";

export const metadata = { title: "Documents" };

export default async function DocumentsPage() {
  const studentId = await getCurrentStudentId();
  const { documents, reviewerNames } = await getStudentDocuments(studentId);
  return (
    <>
      <PageHead title="Documents" description="Upload what your counselor asks for and see what has been checked. Previous versions are always kept." />
      <DocumentsView key={studentId} studentId={studentId} initial={documents} reviewerNames={reviewerNames} />
    </>
  );
}
