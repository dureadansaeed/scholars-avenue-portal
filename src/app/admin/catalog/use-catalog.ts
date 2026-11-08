"use client";

import { useMemo } from "react";
import { mergeRecords, useAdminWork } from "@/lib/admin-work";
import type { getCatalog } from "@/lib/data/admin";

export type CatalogData = Awaited<ReturnType<typeof getCatalog>>;

/** The catalog with this browser's admin edits applied (overlay wins, new records appended). */
export function useCatalog(adminId: string, data: CatalogData) {
  const w = useAdminWork(adminId);
  const programs = useMemo(() => mergeRecords(data.programs, w.work.programs, (p) => p.id), [data.programs, w.work.programs]);
  const universities = useMemo(() => mergeRecords(data.universities, w.work.universities, (u) => u.id), [data.universities, w.work.universities]);
  const cities = useMemo(() => mergeRecords(data.cities, w.work.cities, (c) => c.id), [data.cities, w.work.cities]);
  const countries = useMemo(() => mergeRecords(data.countries, w.work.countries, (c) => c.code).map((c) => ({
    ...c,
    catalogProgress: {
      programs: programs.filter((p) => p.countryCode === c.code && p.status !== "archived").length,
      verified: programs.filter((p) => p.countryCode === c.code && p.status === "verified").length,
    },
  })), [data.countries, w.work.countries, programs]);
  const nameOf = (id?: string) => (!id ? "" : id === adminId ? "you" : data.names[id] ?? id);
  return { w, programs, universities, cities, countries, linked: data.linkedApplications, nameOf };
}
