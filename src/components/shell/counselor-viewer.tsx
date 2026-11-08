import { listDemoCounselors } from "@/lib/data/counselor";
import { getCurrentCounselorId } from "@/lib/session";
import { CounselorSwitcher } from "./counselor-switcher";

// Reads the request cookie, so it renders inside a <Suspense> boundary.
export async function CounselorViewer() {
  const [current, counselors] = await Promise.all([getCurrentCounselorId(), listDemoCounselors()]);
  return <CounselorSwitcher current={current} counselors={counselors} />;
}
