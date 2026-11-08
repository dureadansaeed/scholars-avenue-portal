import { Suspense } from "react";
import PortalLoading from "@/components/shell/portal-loading";
import { notFound } from "next/navigation";
import { getStudentWorkspace } from "@/lib/data/counselor";
import { getCurrentCounselorId } from "@/lib/session";
import { DocumentsReview } from "./documents-review";

export const metadata = { title: "Student documents" };

async function DocumentsTabContent({ params }: Pick<PageProps<"/counselor/students/[id]/documents">, "params">) {
  const { id } = await params;
  const counselorId = await getCurrentCounselorId();
  const w = await getStudentWorkspace(counselorId, id);
  if (!w) notFound();
  return <DocumentsReview counselorId={counselorId} studentId={id} documents={w.documents} reviewerNames={w.reviewerNames} />;
}

// `params` is request-time data, so it is awaited inside a Suspense boundary and the page shell can stream first.
export default function DocumentsTab(props: Pick<PageProps<"/counselor/students/[id]/documents">, "params">) {
  return (
    <Suspense fallback={<PortalLoading />}>
      <DocumentsTabContent {...props} />
    </Suspense>
  );
}
