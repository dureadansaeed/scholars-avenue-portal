"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HueChip } from "@/components/ui/chips";
import { Empty, Section } from "@/components/ui/panels";
import { formatDateTime } from "@/lib/clock";
import { cx } from "@/lib/cx";
import type { getStudentNotifications } from "@/lib/data/student-journey";
import { useLocalState } from "@/lib/use-local-state";
import type { NotificationKind } from "@/types";

type Item = Awaited<ReturnType<typeof getStudentNotifications>>[number];

// Colour by what it means to the reader, not by taxonomy.
const KIND: Record<NotificationKind, [React.ComponentProps<typeof HueChip>["hue"], string]> = {
  document_request: ["amber", "Request"], correction_request: ["red", "Correction"], message: ["blue", "Message"],
  shortlist: ["violet", "Programme"], application_status: ["green", "Application"], deadline: ["orange", "Deadline"],
  assignment: ["teal", "Counselor"], system: ["blue", "Update"],
};

export function NotificationsView({ studentId, items }: { studentId: string; items: Item[] }) {
  const [readIds, setReadIds] = useLocalState<string[]>(`sa:notifs:${studentId}`, []);
  const isRead = (n: Item) => n.read || readIds.includes(n.id);
  const unread = items.filter((n) => !isRead(n));
  const markAll = () => setReadIds(items.map((n) => n.id));

  return (
    <Section flush
      title={unread.length ? `${unread.length} unread` : "All caught up"}
      actions={unread.length > 0 ? <Button size="sm" onClick={markAll}>Mark all as read</Button> : undefined}>
      {items.length === 0 ? (
        <Empty title="No notifications yet">We will tell you here when something needs your attention.</Empty>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((n) => {
            const [hue, label] = KIND[n.kind];
            const read = isRead(n);
            return (
              <li key={n.id}>
                <Link href={n.href} onClick={() => !read && setReadIds((r) => [...r, n.id])}
                  className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-n-850/70">
                  <span aria-hidden className={cx("mt-2 size-2 shrink-0 rounded-full", read ? "bg-transparent" : "bg-blue-500")} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className={cx("text-sm", read ? "text-n-300" : "font-medium text-n-100")}>{n.title}</span>
                      <HueChip hue={hue}>{label}</HueChip>
                      {!read && <span className="sr-only">Unread</span>}
                    </span>
                    <span className="mt-0.5 block text-tiny leading-relaxed text-n-400">{n.body}</span>
                    <time dateTime={n.createdAt} className="mt-1 block text-micro tabular-nums text-n-500">{formatDateTime(n.createdAt)}</time>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}
