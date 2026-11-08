"use client";

import { useEffect } from "react";
import { LOCAL_CHANGE_EVENT } from "@/lib/use-local-state";
import { setBadges } from "./badge-store";

/**
 * Renders nothing: pushes server-computed counts (keyed by nav href) into the
 * sidebar. `unread` lists ids the server considers new, minus any this browser
 * has since marked as read.
 */
export function StaticBadgeSync({ badges, unread }: {
  badges: Record<string, number>; unread?: { href: string; ids: string[]; storageKey: string };
}) {
  const key = JSON.stringify(badges);
  const ids = unread?.ids.join(",");
  useEffect(() => {
    const compute = () => {
      const next = JSON.parse(key) as Record<string, number>;
      if (unread) {
        let read: string[] = [];
        try { read = JSON.parse(localStorage.getItem(unread.storageKey) ?? "[]") as string[]; } catch { /* ignore */ }
        next[unread.href] = unread.ids.filter((id) => !read.includes(id)).length;
      }
      setBadges(next);
    };
    compute();
    window.addEventListener(LOCAL_CHANGE_EVENT, compute);
    window.addEventListener("storage", compute);
    return () => { window.removeEventListener(LOCAL_CHANGE_EVENT, compute); window.removeEventListener("storage", compute); setBadges({}); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `unread` is derived from `ids` and the storage key
  }, [key, ids, unread?.storageKey]);
  return null;
}
