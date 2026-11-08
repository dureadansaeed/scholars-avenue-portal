"use client";

import { useSyncExternalStore } from "react";

// A tiny store so a server-streamed value (unread counts) can reach the static
// sidebar without making the whole layout dynamic. Keys are nav hrefs.
type Badges = Record<string, number>;
const EMPTY: Badges = {};
let current: Badges = EMPTY;
const listeners = new Set<() => void>();

export function setBadges(next: Badges) {
  const same = Object.keys({ ...current, ...next }).every((k) => (current[k] ?? 0) === (next[k] ?? 0));
  if (same) return;
  current = next;
  listeners.forEach((l) => l());
}

export function useBadges(): Badges {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; },
    () => current,
    () => EMPTY,
  );
}
