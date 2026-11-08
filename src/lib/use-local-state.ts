"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Fired after any save, so other components (the sidebar badges) can recompute. */
export const LOCAL_CHANGE_EVENT = "sa:local-change";

/**
 * Frontend-only persistence: state survives reloads and is shared between pages
 * of this browser through localStorage. This is the one seam a real backend
 * replaces; callers do not change.
 */
export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  const skipSave = useRef(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring a saved value after hydration
      if (raw) setValue(JSON.parse(raw) as T);
    } catch { /* a corrupt value is ignored; the initial copy remains */ }
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (skipSave.current) { skipSave.current = false; return; }
    if (ready) { localStorage.setItem(key, JSON.stringify(value)); window.dispatchEvent(new Event(LOCAL_CHANGE_EVENT)); }
  }, [value, ready, key]);

  const update = useCallback((next: T | ((prev: T) => T)) => setValue(next), []);
  return [value, update, ready] as const;
}

/** Short unique id for records created in the browser. */
export const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
