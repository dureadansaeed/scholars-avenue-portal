import { PageHead } from "@/components/ui/navigation";
import { getApplicationsOverview } from "@/lib/data/counselor-work";
import { getCurrentCounselorId } from "@/lib/session";
import { ApplicationsView } from "./applications-view";

export const metadata = { title: "Applications" };

export default async function ApplicationsPage() {
  const counselorId = await getCurrentCounselorId();
  const data = await getApplicationsOverview(counselorId);
  return (
    <>
      <PageHead title="Applications" description="Every application across your students: where it stands and what happens next." />
      <ApplicationsView key={counselorId} counselorId={counselorId} data={data} />
    </>
  );
}
