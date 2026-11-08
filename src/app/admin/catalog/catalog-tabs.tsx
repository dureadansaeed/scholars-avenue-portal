"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { cx } from "@/lib/cx";

const TABS = [
  { href: "/admin/catalog", label: "Programmes", match: (p: string) => p === "/admin/catalog" || p.startsWith("/admin/catalog/programs") },
  { href: "/admin/catalog/universities", label: "Universities", match: (p: string) => p.startsWith("/admin/catalog/universities") },
  { href: "/admin/catalog/cities", label: "Cities", match: (p: string) => p.startsWith("/admin/catalog/cities") },
  { href: "/admin/catalog/countries", label: "Countries", match: (p: string) => p.startsWith("/admin/catalog/countries") },
];

function Tabs({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Catalog" className="-mb-px flex gap-1 overflow-x-auto border-b border-line">
      {TABS.map((t) => {
        const active = t.match(pathname);
        return (
          <Link key={t.href} href={t.href} aria-current={active ? "page" : undefined}
            className={cx("relative whitespace-nowrap px-3 py-2.5 text-sm", active ? "font-medium text-n-100" : "text-n-400 hover:text-n-100")}>
            {t.label}{active && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent" />}
          </Link>
        );
      })}
    </nav>
  );
}
function Active() { return <Tabs pathname={usePathname()} />; }

// usePathname is request-time, so the active underline streams in behind Suspense.
export function CatalogTabs() {
  return <Suspense fallback={<Tabs pathname="" />}><Active /></Suspense>;
}
