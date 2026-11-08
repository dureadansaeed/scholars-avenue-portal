import { PageHead } from "@/components/ui/navigation";
import { getStudentNotifications } from "@/lib/data/student-journey";
import { getCurrentStudentId } from "@/lib/session";
import { NotificationsView } from "./notifications-view";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const studentId = await getCurrentStudentId();
  const items = await getStudentNotifications(studentId);
  return (
    <>
      <PageHead title="Notifications" description="Requests, replies and deadlines. Each one links to the page where you can act on it." />
      <NotificationsView key={studentId} studentId={studentId} items={items} />
    </>
  );
}
