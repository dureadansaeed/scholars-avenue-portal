import { describe, expect, it } from "vitest";
import { applyFilters, deadlineState, flatten, freshnessWarnings, NO_FILTERS } from "@/lib/program-search";
import { cities, programs, universities } from "@/mocks/catalog";

const rows = flatten({
  programs, cities: cities.map((c) => ({ id: c.id, name: c.name, countryCode: c.countryCode })),
  universities: universities.map((u) => ({ id: u.id, name: u.name, type: u.type, countryCode: u.countryCode })),
});

describe("program search", () => {
  it("hides archived records unless asked", () => {
    expect(applyFilters(rows, NO_FILTERS).some((r) => r.program.status === "archived")).toBe(false);
    expect(applyFilters(rows, { ...NO_FILTERS, includeArchived: true }).some((r) => r.program.status === "archived")).toBe(true);
  });

  it("never reports an unpublished deadline as open", () => {
    const unknown = rows.find((r) => r.program.id === "prg-de-de")!;
    expect(deadlineState(unknown.intake)).toBe("unknown");
    expect(applyFilters(rows, { ...NO_FILTERS, deadline: "open" }).some((r) => r.key === unknown.key)).toBe(false);
    expect(applyFilters(rows, { ...NO_FILTERS, deadline: "unknown" }).some((r) => r.key === unknown.key)).toBe(true);
  });

  it("keeps programmes whose fee is unknown when a budget is set", () => {
    const withBudget = applyFilters(rows, { ...NO_FILTERS, maxTuition: "10000" });
    expect(withBudget.some((r) => r.program.id === "prg-nl-ds")).toBe(false); // 18,500 per year is over
    expect(withBudget.some((r) => r.program.id === "prg-de-cs")).toBe(true);
    expect(withBudget.some((r) => r.program.id === "prg-fi-cs")).toBe(true); // fee unknown, kept
  });

  it("treats a passed deadline as passed", () => {
    expect(applyFilters(rows, { ...NO_FILTERS, deadline: "passed" }).map((r) => r.program.id)).toContain("prg-au-it");
  });

  it("warns on unverified, stale and incomplete records", () => {
    const stale = rows.find((r) => r.program.id === "prg-se-ml")!;
    expect(freshnessWarnings(stale.program, stale.intake).join(" ")).toMatch(/days ago/);
    const draft = rows.find((r) => r.program.id === "prg-ro-cs")!;
    const w = freshnessWarnings(draft.program, draft.intake).join(" ");
    expect(w).toMatch(/Not yet verified/);
    expect(w).toMatch(/not recorded/);
  });
});
