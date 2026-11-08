import Link from "next/link";
import { Status } from "@/components/ui/chips";
import { PageHead } from "@/components/ui/navigation";
import { Empty, Section } from "@/components/ui/panels";
import { daysUntil, formatDate } from "@/lib/clock";
import { cx } from "@/lib/cx";
import { getAgenda, type AgendaItem } from "@/lib/data/counselor-tasks";
import { getCurrentCounselorId } from "@/lib/session";

export const metadata = { title: "Agenda" };

const KIND: Record<AgendaItem["kind"], [React.ComponentProps<typeof Status>["tone"], string]> = {
  task: ["info", "Task"], chase: ["warn", "Student action"], deadline: ["bad", "Deadline"], test: ["warn", "Test expiry"], document: ["neutral", "Document due"],
};

/** A plain agenda rather than a calendar: dates grouped by how soon they bite. No external calendar integration (PRD TSK-014 is P2). */
export default async function AgendaPage() {
  const items = await getAgenda(await getCurrentCounselorId());
  const groups: { title: string; hint: string; items: AgendaItem[] }[] = [
    { title: "Overdue", hint: "Past their date and still open.", items: items.filter((i) => i.overdue) },
    { title: "This week", hint: "Next 7 days.", items: items.filter((i) => !i.overdue && daysUntil(i.date) <= 7) },
    { title: "Next 30 days", hint: "", items: items.filter((i) => !i.overdue && daysUntil(i.date) > 7 && daysUntil(i.date) <= 30) },
    { title: "Later", hint: "", items: items.filter((i) => !i.overdue && daysUntil(i.date) > 30) },
  ];
  return (
    <>
      <PageHead title="Agenda" description="Deadlines, due tasks, document requests and test expiries across your students, in date order." />
      {items.length === 0 ? <Section><Empty title="Nothing scheduled">Dates from tasks, applications and tests will appear here.</Empty></Section> : (
        <div className="space-y-4">
          {groups.filter((g) => g.items.length).map((g) => (
            <Section key={g.title} title={`${g.title} (${g.items.length})`} description={g.hint || undefined} flush>
              <ul className="divide-y divide-line">
                {g.items.map((i) => (
                  <li key={i.id}>
                    <Link href={i.href} className="flex items-start gap-4 px-5 py-3 transition-colors hover:bg-n-850/70">
                      <time dateTime={i.date} className={cx("w-24 shrink-0 text-tiny tabular-nums", i.overdue ? "text-bad-400" : "text-n-400")}>{formatDate(i.date)}</time>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-n-100">{i.title}</span>
                        <span className="block truncate text-tiny text-n-500">{i.student}</span>
                      </span>
                      {i.overdue ? <Status tone="bad">Overdue</Status> : <Status tone={KIND[i.kind][0]}>{KIND[i.kind][1]}</Status>}
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          ))}
        </div>
      )}
    </>
  );
}
