"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HueChip } from "@/components/ui/chips";
import { Empty, Section } from "@/components/ui/panels";
import { formatDate } from "@/lib/clock";
import { cx } from "@/lib/cx";
import type { FeedItem } from "@/lib/data/counselor-tasks";
import { useLocalState } from "@/lib/use-local-state";

const KIND: Record<FeedItem["kind"], [React.ComponentProps<typeof HueChip>["hue"], string]> = {
  assignment: ["teal", "Assigned"], upload: ["blue", "Upload"], deadline: ["orange", "Deadline"], overdue: ["red", "Overdue"],
};

export function FeedView({ counselorId, items }: { counselorId: string; items: FeedItem[] }) {
  const [readIds, setReadIds] = useLocalState<string[]>(`sa:cns:notifs:${counselorId}`, []);
  const unread = items.filter((i) => !readIds.includes(i.id)).length;
  return (
    <Section flush title={unread ? `${unread} unread` : "All caught up"}
      actions={unread > 0 ? <Button size="sm" onClick={() => setReadIds(items.map((i) => i.id))}>Mark all as read</Button> : undefined}>
      {items.length === 0 ? <Empty title="Nothing yet">Assignments, uploads and deadlines will show up here.</Empty> : (
        <ul className="divide-y divide-line">
          {items.map((n) => {
            const read = readIds.includes(n.id);
            const [hue, label] = KIND[n.kind];
            return (
              <li key={n.id}>
                <Link href={n.href} onClick={() => !read && setReadIds((r) => [...r, n.id])} className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-n-850/70">
                  <span aria-hidden className={cx("mt-2 size-2 shrink-0 rounded-full", read ? "bg-transparent" : "bg-blue-500")} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className={cx("text-sm", read ? "text-n-300" : "font-medium text-n-100")}>{n.title}</span><HueChip hue={hue}>{label}</HueChip>
                      {!read && <span className="sr-only">Unread</span>}
                    </span>
                    <span className="mt-0.5 block text-tiny leading-relaxed text-n-400">{n.body}</span>
                    <time dateTime={n.at} className="mt-1 block text-micro tabular-nums text-n-500">{formatDate(n.at)}</time>
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
