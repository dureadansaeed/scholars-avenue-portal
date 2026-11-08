import { Suspense } from "react";
import PortalLoading from "@/components/shell/portal-loading";
import { notFound } from "next/navigation";
import { getApplicationBundle } from "@/lib/data/counselor-work";
import { getCurrentCounselorId } from "@/lib/session";
import { ApplicationWorkspace } from "./application-workspace";

export const metadata = { title: "Application" };

async function ApplicationPageContent({ params }: Pick<PageProps<"/counselor/applications/[id]">, "params">) {
  const { id } = await params;
  const counselorId = await getCurrentCounselorId();
  const bundle = await getApplicationBundle(counselorId, id);
  // Another counselor's application and an unknown id look the same.
  if (!bundle) notFound();
  return <ApplicationWorkspace counselorId={counselorId} bundle={bundle} />;
}

// `params` is request-time data, so it is awaited inside a Suspense boundary and the page shell can stream first.
export default function ApplicationPage(props: Pick<PageProps<"/counselor/applications/[id]">, "params">) {
  return (
    <Suspense fallback={<PortalLoading />}>
      <ApplicationPageContent {...props} />
    </Suspense>
  );
}
