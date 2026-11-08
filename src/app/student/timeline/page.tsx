import { PageHead } from "@/components/ui/navigation";
import { Timeline } from "@/components/ui/domain";
import { Empty, Section } from "@/components/ui/panels";
import { getStudentTimeline } from "@/lib/data/student-journey";
import { getCurrentStudentId } from "@/lib/session";

export const metadata = { title: "Timeline" };

export default async function TimelinePage() {
  const events = await getStudentTimeline(await getCurrentStudentId());
  return (
    <>
      <PageHead title="Timeline" description="Everything important that has happened on your case, newest first. Internal team notes are never shown here." />
      <Section>
        {events.length === 0 ? <Empty title="Nothing here yet">Milestones will appear as your case moves forward.</Empty> : <Timeline events={events} />}
      </Section>
    </>
  );
}
