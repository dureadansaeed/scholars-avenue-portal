"use client";

import { AnimatePresence, motion as m } from "motion/react";
import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { cx } from "@/lib/cx";
import { prefersReducedMotion, springFor } from "@/lib/motion";
import { Icon } from "./icons";

const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

// Open dialogs, innermost last. Only the top one answers Esc and Tab, so a sheet
// opened from a side panel closes alone.
const openStack: symbol[] = [];

/** Esc closes, body scroll locks, focus moves in and is restored, Tab stays inside. */
function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  // Callers pass inline handlers. Keeping the latest in a ref stops the effect
  // below from re-running (and stealing focus) on every keystroke in a form.
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  useEffect(() => {
    if (!open) return;
    const token = Symbol("dialog");
    openStack.push(token);
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const node = ref.current;
    (node?.querySelector<HTMLElement>("[data-autofocus]") ?? node?.querySelector<HTMLElement>(FOCUSABLE) ?? node)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (openStack[openStack.length - 1] !== token) return;
      if (e.key === "Escape") { e.stopPropagation(); closeRef.current(); return; }
      if (e.key !== "Tab" || !node) return;
      const items = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      openStack.splice(openStack.indexOf(token), 1);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open]);
  return ref;
}

function Scrim({ onClick }: { onClick: () => void }) {
  return <m.div className="absolute inset-0 bg-n-100/25" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    transition={{ duration: 0.18 }} onClick={onClick} />;
}

interface OverlayProps {
  open: boolean; onClose: () => void; title: string; description?: string;
  children: React.ReactNode; footer?: React.ReactNode;
}

function Header({ id, title, description, onClose }: { id: string; title: string; description?: string; onClose: () => void }) {
  return (
    <div className="scroll-edge relative flex items-start justify-between gap-4 border-b border-line/70 px-5 py-4">
      <div className="min-w-0">
        <h2 id={id} className="vibrant text-lg font-semibold">{title}</h2>
        {description && <p className="vibrant-secondary mt-0.5 text-tiny">{description}</p>}
      </div>
      <button type="button" onClick={onClose} aria-label="Close" className="press rounded-full p-1.5 text-n-400 hover:bg-n-850 hover:text-n-100">
        <Icon.X />
      </button>
    </div>
  );
}

/** Modal. Materialises (scale + blur) rather than fading. */
export function Sheet({ open, onClose, title, description, children, footer, wide }: OverlayProps & { wide?: boolean }) {
  const mounted = useMounted();
  const ref = useDialog(open, onClose);
  const id = useId();
  if (!mounted) return null;
  const reduced = prefersReducedMotion();
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 sm:p-6">
          <Scrim onClick={onClose} />
          <m.div ref={ref} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1}
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, filter: "blur(14px)" }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, filter: "blur(10px)" }}
            transition={springFor()}
            className={cx("material-thick material-edge relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-lg border border-line outline-none", wide ? "max-w-4xl" : "max-w-2xl")}>
            <Header id={id} title={title} description={description} onClose={onClose} />
            <div className="overflow-auto px-5 py-4">{children}</div>
            {footer && <div className="flex items-center justify-end gap-2 border-t border-line/70 px-5 py-3">{footer}</div>}
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Detail drawer anchored right; exits to the side it entered from. */
export function SidePanel({ open, onClose, title, description, children, footer }: OverlayProps) {
  const mounted = useMounted();
  const ref = useDialog(open, onClose);
  const id = useId();
  if (!mounted) return null;
  const reduced = prefersReducedMotion();
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <Scrim onClick={onClose} />
          <m.div ref={ref} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1}
            initial={reduced ? { opacity: 0 } : { x: 40, opacity: 0, filter: "blur(12px)" }}
            animate={reduced ? { opacity: 1 } : { x: 0, opacity: 1, filter: "blur(0px)" }}
            exit={reduced ? { opacity: 0 } : { x: 40, opacity: 0, filter: "blur(12px)" }}
            transition={springFor()}
            className="material-thick absolute inset-y-0 right-0 flex h-full w-full max-w-lg flex-col border-l border-line outline-none">
            <Header id={id} title={title} description={description} onClose={onClose} />
            <div className="flex-1 overflow-auto px-5 py-4">{children}</div>
            {footer && <div className="flex items-center justify-end gap-2 border-t border-line/70 px-5 py-3">{footer}</div>}
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Floating action pill: sits above the list so rows never shift under the cursor. */
export function SelectionBar({ open, children }: { open: boolean; children: React.ReactNode }) {
  const mounted = useMounted();
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={springFor()}
          className="material-thick material-edge fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-line py-2 pr-2 pl-4 text-sm">
          {children}
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Glass needs something behind it; on a white page the panel brings its own colour. */
export function GlassPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cx("relative overflow-hidden rounded-lg border border-line", className)}>
      <span aria-hidden className="absolute -top-10 -left-8 size-40 rounded-full bg-hue-blue blur-2xl" />
      <span aria-hidden className="absolute -right-10 top-4 size-44 rounded-full bg-hue-violet blur-2xl" />
      <span aria-hidden className="absolute -bottom-12 left-1/3 size-40 rounded-full bg-hue-teal blur-2xl" />
      <div className="material-thin material-edge relative">{children}</div>
    </div>
  );
}
