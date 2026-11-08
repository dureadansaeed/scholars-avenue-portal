import { Suspense } from "react";
import PortalLoading from "@/components/shell/portal-loading";
import { notFound } from "next/navigation";
import { getStudentWorkBundle } from "@/lib/data/counselor-work";
import { getCurrentCounselorId } from "@/lib/session";
import { StudentApplications } from "./student-applications";

export const metadata = { title: "Student applications" };

async function ApplicationsTabContent({ params }: Pick<PageProps<"/counselor/students/[id]/applications">, "params">) {
  const { id } = await params;
  const counselorId = await getCurrentCounselorId();
  const bundle = await getStudentWorkBundle(counselorId, id);
  if (!bundle) notFound();
  return <StudentApplications counselorId={counselorId} bundle={bundle} />;
}

// `params` is request-time data, so it is awaited inside a Suspense boundary and the page shell can stream first.
export default function ApplicationsTab(props: Pick<PageProps<"/counselor/students/[id]/applications">, "params">) {
  return (
    <Suspense fallback={<PortalLoading />}>
      <ApplicationsTabContent {...props} />
    </Suspense>
  );
}
