"use client";

import { AnimatePresence, motion as m } from "motion/react";
import { useEffect, useId, useState } from "react";
import { cx } from "@/lib/cx";
import { springFor } from "@/lib/motion";
import { Icon } from "./icons";

/** Segmented control: for a handful of exclusive views, instead of a dropdown. */
export function Segmented<T extends string>({ value, onChange, options, size = "md", label }: {
  value: T; onChange: (v: T) => void; label: string; size?: "sm" | "md";
  options: { value: T; label: string; count?: number }[];
}) {
  const group = useId();
  return (
    <div role="tablist" aria-label={label} className="inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full bg-n-850 p-0.5 [scrollbar-width:none]">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} type="button" role="tab" aria-selected={active} onClick={() => onChange(o.value)}
            className={cx("press relative shrink-0 whitespace-nowrap rounded-full px-3", size === "md" ? "h-8 text-sm" : "h-7 text-tiny", active ? "font-medium text-n-100 forced-colors:underline forced-colors:underline-offset-4" : "text-n-400 hover:text-n-100")}>
            {active && <m.span layoutId={`seg-${group}`} transition={springFor()} className="absolute inset-0 -z-10 rounded-full bg-surface shadow-card forced-colors:border-2 forced-colors:border-[Highlight]" />}
            {o.label}
            {o.count != null && <span className="ml-1.5 text-micro tabular-nums text-n-500">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Hides configuration so a screen opens on what you came to do. */
export function Disclosure({ title, description, defaultOpen = false, children }: {
  title: string; description?: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className="rounded-lg border border-line bg-surface">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}
        className="press flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
        <span>
          <span className="block text-sm font-semibold tracking-tight text-n-100">{title}</span>
          {description && <span className="mt-0.5 block text-tiny text-n-400">{description}</span>}
        </span>
        <m.span animate={{ rotate: open ? 90 : 0 }} transition={springFor()} className="text-n-500"><Icon.Chevron className="size-3.5" /></m.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <m.div id={id} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={springFor()} className="overflow-hidden">
            <div className="border-t border-line p-5">{children}</div>
          </m.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/**
 * iOS large title that collapses into a compact glass bar after 72px of scroll.
 * The bar is short on purpose: floating chrome has to be short enough to be chrome.
 */
export function PageHead({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const onScroll = () => setCollapsed(window.scrollY > 72);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <>
      <AnimatePresence>
        {collapsed && (
          <m.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={springFor()}
            style={{ left: "var(--sidebar-w, 0px)" }}
            className="material material-edge fixed inset-x-0 top-0 z-40 border-b border-line">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-2.5 lg:px-10">
              <p className="vibrant truncate text-base font-semibold">{title}</p>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          </m.div>
        )}
      </AnimatePresence>
      <div className="flex flex-wrap items-end justify-between gap-4 pb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-n-100">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-base leading-relaxed text-n-400">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </>
  );
}
