import { getCounselorBadgeCounts } from "@/lib/data/counselor";
import { getCounselorFeed } from "@/lib/data/counselor-tasks";
import { getCurrentCounselorId } from "@/lib/session";
import { StaticBadgeSync } from "./static-badge-sync";

export async function CounselorBadges() {
  const id = await getCurrentCounselorId();
  const [counts, feed] = await Promise.all([getCounselorBadgeCounts(id), getCounselorFeed(id)]);
  return (
    <StaticBadgeSync
      badges={{ "/counselor/students": counts.pendingReviews, "/counselor/tasks": counts.overdueTasks }}
      unread={{ href: "/counselor/notifications", ids: feed.map((f) => f.id), storageKey: `sa:cns:notifs:${id}` }}
    />
  );
}
