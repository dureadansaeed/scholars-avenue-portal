import { PageHead } from "@/components/ui/navigation";
import { getCounselorFeed } from "@/lib/data/counselor-tasks";
import { getCurrentCounselorId } from "@/lib/session";
import { FeedView } from "./feed-view";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const counselorId = await getCurrentCounselorId();
  const items = await getCounselorFeed(counselorId);
  return (
    <>
      <PageHead title="Notifications" description="New assignments, uploads waiting for review, approaching deadlines and overdue tasks." />
      <FeedView key={counselorId} counselorId={counselorId} items={items} />
    </>
  );
}
