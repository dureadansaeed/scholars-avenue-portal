"use client";

import { useEffect } from "react";
import { LOCAL_CHANGE_EVENT } from "@/lib/use-local-state";
import type { StudentDocument } from "@/types";
import { setBadges } from "./badge-store";

const read = <T,>(key: string, fallback: T): T => {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
};

/**
 * Renders nothing. Takes the server's view of what is unread / open and
 * subtracts what this browser has since read or finished, so the badges match
 * what the pages show.
 */
export function StudentBadgeSync({ studentId, unreadNotificationIds, openTaskIds, docActionIds }: {
  studentId: string; unreadNotificationIds: string[]; openTaskIds: string[]; docActionIds: string[];
}) {
  useEffect(() => {
    const compute = () => {
      const readIds = read<string[]>(`sa:notifs:${studentId}`, []);
      const doneTasks = read<Record<string, unknown>>(`sa:tasks:${studentId}`, {});
      const localDocs = read<StudentDocument[] | null>(`sa:docs:${studentId}`, null);
      const needs = new Set(["requested", "rejected", "replacement_required", "expired"]);
      setBadges({
        "/student/notifications": unreadNotificationIds.filter((id) => !readIds.includes(id)).length,
        "/student/tasks": openTaskIds.filter((id) => !(id in doneTasks)).length,
        "/student/documents": localDocs ? localDocs.filter((d) => needs.has(d.status)).length : docActionIds.length,
      });
    };
    compute();
    window.addEventListener(LOCAL_CHANGE_EVENT, compute);
    window.addEventListener("storage", compute);
    return () => { window.removeEventListener(LOCAL_CHANGE_EVENT, compute); window.removeEventListener("storage", compute); setBadges({}); };
  }, [studentId, unreadNotificationIds, openTaskIds, docActionIds]);
  return null;
}
