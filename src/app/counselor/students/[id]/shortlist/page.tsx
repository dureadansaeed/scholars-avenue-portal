import { Suspense } from "react";
import PortalLoading from "@/components/shell/portal-loading";
import { notFound } from "next/navigation";
import { getStudentWorkBundle } from "@/lib/data/counselor-work";
import { getCurrentCounselorId } from "@/lib/session";
import { ShortlistView } from "./shortlist-view";

export const metadata = { title: "Student shortlist" };

async function ShortlistTabContent({ params }: Pick<PageProps<"/counselor/students/[id]/shortlist">, "params">) {
  const { id } = await params;
  const counselorId = await getCurrentCounselorId();
  const bundle = await getStudentWorkBundle(counselorId, id);
  if (!bundle) notFound();
  return <ShortlistView counselorId={counselorId} bundle={bundle} />;
}

// `params` is request-time data, so it is awaited inside a Suspense boundary and the page shell can stream first.
export default function ShortlistTab(props: Pick<PageProps<"/counselor/students/[id]/shortlist">, "params">) {
  return (
    <Suspense fallback={<PortalLoading />}>
      <ShortlistTabContent {...props} />
    </Suspense>
  );
}
