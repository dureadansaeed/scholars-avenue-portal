import { Suspense } from "react";
import PortalLoading from "@/components/shell/portal-loading";
import { notFound } from "next/navigation";
import { getStudentWorkspace } from "@/lib/data/counselor";
import { getCurrentCounselorId } from "@/lib/session";
import { GapsPanel } from "../gaps-panel";
import { ProfileReview } from "./profile-review";

export const metadata = { title: "Student profile" };

async function ProfileTabContent({ params }: Pick<PageProps<"/counselor/students/[id]/profile">, "params">) {
  const { id } = await params;
  const counselorId = await getCurrentCounselorId();
  const w = await getStudentWorkspace(counselorId, id);
  if (!w) notFound();
  return (
    <div className="space-y-4">
      <GapsPanel gaps={w.gaps} studentId={id} />
      <ProfileReview counselorId={counselorId} studentId={id} data={{
        profile: w.profile, academics: w.academics, languageTests: w.languageTests, otherTests: w.otherTests,
        preference: w.preference, reviewerNames: w.reviewerNames,
      }} />
    </div>
  );
}

// `params` is request-time data, so it is awaited inside a Suspense boundary and the page shell can stream first.
export default function ProfileTab(props: Pick<PageProps<"/counselor/students/[id]/profile">, "params">) {
  return (
    <Suspense fallback={<PortalLoading />}>
      <ProfileTabContent {...props} />
    </Suspense>
  );
}
