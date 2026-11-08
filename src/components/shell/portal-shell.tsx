"use client";

import { AnimatePresence, motion as m } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { cx } from "@/lib/cx";
import { springFor } from "@/lib/motion";
import { Icon } from "@/components/ui/icons";
import { useBadges } from "./badge-store";
import type { NavGroup, NavItem } from "./nav";

const STORAGE_KEY = "sa:sidebar-collapsed";
const EXPANDED = 224;
const COLLAPSED = 68;

function NavLink({ item, collapsed, active, onNavigate }: { item: NavItem; collapsed: boolean; active: boolean; onNavigate?: () => void }) {
  const G = Icon[item.icon];
  const count = useBadges()[item.href] ?? 0;
  const inner = (
    <>
      {active && <m.span layoutId="nav-selected" transition={springFor()} className="absolute inset-0 -z-10 rounded-sm bg-n-850 forced-colors:border-2 forced-colors:border-[Highlight]" />}
      <span className="relative shrink-0">
        <G className={cx("size-4", active ? "text-n-100" : "text-n-500")} />
        {collapsed && count > 0 && <span aria-hidden className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-blue-500 ring-2 ring-surface" />}
      </span>
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {!collapsed && !item.soon && count > 0 && (
        <span className="rounded-full bg-n-800 px-1.5 py-px text-micro font-medium tabular-nums text-n-300">
          {count > 99 ? "99+" : count}<span className="sr-only"> need attention</span>
        </span>
      )}
      {!collapsed && item.soon && <span className="rounded-full bg-n-850 px-1.5 py-px text-micro text-n-500">Soon</span>}
    </>
  );
  const cls = cx("press relative flex w-full items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-sm",
    active ? "font-medium text-n-100" : "text-n-400", item.soon ? "cursor-not-allowed opacity-60" : !active && "hover:text-n-100");
  if (item.soon) {
    return <span className={cls} aria-disabled="true" title={`${item.label}: planned, not built yet`}>{inner}</span>;
  }
  return <Link href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} title={collapsed ? item.label : undefined} className={cls}>{inner}</Link>;
}

// usePathname is a request-time value, so the active highlight lives behind a
// Suspense boundary and the rest of the shell can still be prerendered.
function Nav(props: { groups: NavGroup[]; collapsed: boolean; onNavigate?: () => void }) {
  return (
    <Suspense fallback={<NavList {...props} pathname="" />}>
      <ActiveNav {...props} />
    </Suspense>
  );
}
function ActiveNav(props: { groups: NavGroup[]; collapsed: boolean; onNavigate?: () => void }) {
  return <NavList {...props} pathname={usePathname()} />;
}
function NavList({ groups, collapsed, onNavigate, pathname }: { groups: NavGroup[]; collapsed: boolean; onNavigate?: () => void; pathname: string }) {
  const isActive = (i: NavItem) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(`${i.href}/`));
  return (
    <nav aria-label="Primary" className="flex-1 space-y-4 overflow-y-auto">
      {groups.map((g, gi) => (
        <div key={g.label}>
          {collapsed
            ? gi > 0 && <div className="mx-1 my-1.5 border-t border-line/60" />
            : <p className="px-2.5 pb-1.5 text-micro font-medium tracking-wide text-n-500 uppercase">{g.label}</p>}
          <div className="space-y-0.5">
            {g.items.map((i) => <NavLink key={i.href} item={i} collapsed={collapsed} active={isActive(i)} onNavigate={onNavigate} />)}
          </div>
        </div>
      ))}
    </nav>
  );
}

function Brand({ portal, collapsed }: { portal: string; collapsed: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-2.5 pb-4">
      <span className="grid size-7 shrink-0 place-items-center rounded-sm bg-accent text-n-950"><Icon.Logo className="size-4" /></span>
      {!collapsed && (
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-semibold tracking-tight text-n-100">Scholars Avenue</span>
          <span className="block text-micro text-n-500">{portal}</span>
        </span>
      )}
    </div>
  );
}

export function PortalShell({ portal, groups, footer, sync, children }: {
  portal: string; groups: NavGroup[]; footer?: React.ReactNode; sync?: React.ReactNode; children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring a persisted preference after hydration
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setCollapsed((c) => { localStorage.setItem(STORAGE_KEY, c ? "0" : "1"); return !c; });
      }
      if (e.key === "Escape") setDrawer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggle = () => setCollapsed((c) => { localStorage.setItem(STORAGE_KEY, c ? "0" : "1"); return !c; });

  return (
    <div className={cx("flex min-h-dvh [--sidebar-w:0px]", collapsed ? "md:[--sidebar-w:68px]" : "md:[--sidebar-w:224px]")}>
      <a href="#main" className="sr-only z-[60] rounded-full bg-accent px-4 py-2 text-sm text-n-950 focus:not-sr-only focus:fixed focus:top-3 focus:left-3">Skip to content</a>
      {sync}
      <m.aside
        initial={false}
        animate={{ width: collapsed ? COLLAPSED : EXPANDED }}
        transition={springFor()}
        className="material sticky top-0 z-20 hidden h-dvh shrink-0 flex-col border-r border-line px-2.5 py-4 md:flex"
      >
        <Brand portal={portal} collapsed={collapsed} />
        <Nav groups={groups} collapsed={collapsed} />
        {!collapsed && footer && <div className="pt-3">{footer}</div>}
        <button type="button" onClick={toggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title="Toggle sidebar (Ctrl/Cmd+B)"
          className="press mt-2 flex items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-sm text-n-500 hover:bg-n-850 hover:text-n-100">
          <Icon.Sidebar className="size-4 shrink-0" />{!collapsed && <span>Collapse</span>}
        </button>
      </m.aside>

      <div className="min-w-0 flex-1">
        <div className="material flex items-center justify-between border-b border-line px-4 py-2.5 md:hidden">
          <button type="button" onClick={() => setDrawer(true)} aria-label="Open navigation" className="press rounded-full p-1.5 text-n-300 hover:bg-n-850">
            <Icon.Menu />
          </button>
          <span className="text-sm font-semibold tracking-tight">Scholars Avenue</span>
          <span className="w-8" />
        </div>
        <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-6 outline-none sm:px-6 sm:py-8 lg:px-10">
          {children}
        </main>
      </div>

      <AnimatePresence>
        {drawer && (
          <div className="fixed inset-0 z-50 md:hidden">
            <m.div className="absolute inset-0 bg-black/60 backdrop-blur-xs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }} onClick={() => setDrawer(false)} />
            <m.div role="dialog" aria-modal="true" aria-label="Navigation" initial={{ x: -288 }} animate={{ x: 0 }} exit={{ x: -288 }} transition={springFor()}
              className="material-thick absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col px-2.5 py-4">
              <Brand portal={portal} collapsed={false} />
              <Nav groups={groups} collapsed={false} onNavigate={() => setDrawer(false)} />
              {footer && <div className="pt-3">{footer}</div>}
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
