import Link from "next/link";
import { formatDate, relativeDays } from "@/lib/clock";
import { cx } from "@/lib/cx";
import type { CriterionResult, TimelineEvent } from "@/types";
import { CriterionChip, TaskStatusChip } from "./chips";
import { Icon } from "./icons";

/** Ordered, newest first. Callers pass only the events the viewer may see. */
export function Timeline({ events }: { events: Pick<TimelineEvent, "id" | "at" | "title" | "detail">[] }) {
  return (
    <ol className="relative space-y-4 border-l border-line pl-5">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span aria-hidden className="absolute top-1.5 -left-[25px] size-2 rounded-full border border-line-strong bg-surface" />
          <p className="text-sm text-n-100">{e.title}</p>
          {e.detail && <p className="text-tiny text-n-400">{e.detail}</p>}
          <time dateTime={e.at} className="text-tiny tabular-nums text-n-500">{formatDate(e.at)}</time>
        </li>
      ))}
    </ol>
  );
}

/** One row per criterion, each with its state and the reason (PRD 7.7.1). */
export function CriterionList({ criteria }: { criteria: CriterionResult[] }) {
  return (
    <ul className="divide-y divide-line rounded-md border border-line">
      {criteria.map((c) => (
        <li key={c.key} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-n-100">{c.label}</p>
            <p className="mt-0.5 text-tiny leading-relaxed text-n-400">{c.reason}</p>
          </div>
          <CriterionChip state={c.state} />
        </li>
      ))}
    </ul>
  );
}

export function TaskRow({ title, dueDate, status, overdue, href, hint }: {
  title: string; dueDate: string; status: Parameters<typeof TaskStatusChip>[0]["status"]; overdue?: boolean; href?: string; hint?: string;
}) {
  const body = (
    <>
      <span className={cx("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border", status === "completed" ? "border-ok-400 bg-ok-400 text-n-950" : "border-line-strong text-transparent")}>
        <Icon.Check className="size-3" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cx("block truncate text-sm", status === "completed" ? "text-n-400 line-through" : "text-n-100")}>{title}</span>
        <span className="block text-tiny text-n-500">
          <span className="tabular-nums">Due {formatDate(dueDate)}</span>
          {status !== "completed" && <span> · {relativeDays(dueDate)}</span>}
          {hint && <span> · {hint}</span>}
        </span>
      </span>
      <TaskStatusChip status={status} overdue={overdue} />
    </>
  );
  const cls = "flex items-start gap-3 px-5 py-3";
  return href ? <Link href={href} className={cx(cls, "transition-colors hover:bg-n-850/70")}>{body}</Link> : <div className={cls}>{body}</div>;
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span aria-hidden className={cx("inline-grid shrink-0 place-items-center rounded-full bg-n-850 font-medium text-n-300",
      size === "sm" ? "size-6 text-micro" : size === "lg" ? "size-12 text-base" : "size-8 text-tiny")}>
      {initials}
    </span>
  );
}
