"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { cx } from "@/lib/cx";

const TABS: { path: string; label: string; soon?: boolean }[] = [
  { path: "", label: "Overview" },
  { path: "/profile", label: "Profile" },
  { path: "/documents", label: "Documents" },
  { path: "/shortlist", label: "Shortlist" },
  { path: "/applications", label: "Applications" },
  { path: "/tasks", label: "Tasks" },
  { path: "/timeline", label: "Timeline" },
];

function Tabs({ base, pathname }: { base: string; pathname: string }) {
  return (
    <nav aria-label="Student workspace" className="-mb-px flex gap-1 overflow-x-auto">
      {TABS.map((t) => {
        const href = base + t.path;
        const active = t.path === "" ? pathname === base : pathname.startsWith(href);
        const cls = cx("relative whitespace-nowrap px-3 py-2.5 text-sm", active ? "font-medium text-n-100" : "text-n-400", t.soon ? "cursor-not-allowed opacity-50" : !active && "hover:text-n-100");
        return t.soon
          ? <span key={t.path} className={cls} aria-disabled="true" title={`${t.label}: planned, not built yet`}>{t.label}</span>
          : <Link key={t.path} href={href} aria-current={active ? "page" : undefined} className={cls}>
              {t.label}{active && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent" />}
            </Link>;
      })}
    </nav>
  );
}

function Active({ base }: { base: string }) {
  return <Tabs base={base} pathname={usePathname()} />;
}

// usePathname is request-time, so the active underline streams in behind Suspense.
export function WorkspaceTabs({ studentId }: { studentId: string }) {
  const base = `/counselor/students/${studentId}`;
  return <Suspense fallback={<Tabs base={base} pathname="" />}><Active base={base} /></Suspense>;
}
