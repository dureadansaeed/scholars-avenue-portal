import { describe, expect, it } from "vitest";
import { checkRecordMove, isStale, RECORD_NEXT, validateProgram } from "@/lib/catalog-rules";
import { programs } from "@/mocks/catalog";
import type { Program } from "@/types";

const p = (id: string) => structuredClone(programs.find((x) => x.id === id)!) as Program;

describe("catalog record workflow", () => {
  it("never deletes: every status can reach archived or come back from it", () => {
    expect(RECORD_NEXT.archived).toContain("pending_review");
    expect(Object.values(RECORD_NEXT).flat()).not.toContain("deleted");
  });

  it("refuses to verify without an official source", () => {
    const draft = p("prg-ro-cs");
    draft.status = "pending_review";
    expect(checkRecordMove(draft, "verified")).toMatch(/official source/);
    draft.source.url = "https://example.test/programme";
    expect(checkRecordMove(draft, "verified")).toBeNull();
  });

  it("requires a reason to archive or mark outdated", () => {
    expect(checkRecordMove(p("prg-de-cs"), "archived")).toMatch(/reason/i);
    expect(checkRecordMove(p("prg-de-cs"), "archived", "Programme discontinued")).toBeNull();
  });

  it("blocks moves that are not in the workflow", () => {
    expect(checkRecordMove(p("prg-ro-cs"), "verified")).toMatch(/cannot move/);
  });

  it("flags verified records past the review interval as stale", () => {
    expect(isStale(p("prg-se-ml"))).toBe(true);   // checked 2025-12-01
    expect(isStale(p("prg-de-cs"))).toBe(false);  // checked 2026-09-20
    expect(isStale(p("prg-de-de"))).toBe(false);  // not verified, so not "stale"
  });
});

describe("programme validation", () => {
  it("accepts unknown requirements as they are", () => {
    expect(validateProgram(p("prg-ro-cs"))).toEqual({});
  });

  it("never assumes a grade scale", () => {
    const x = p("prg-de-cs");
    x.requirements.minGrade = { status: "required", value: { value: 3, scale: 0 } };
    expect(validateProgram(x).minGradeScale).toMatch(/never assumed/);
  });

  it("rejects a minimum above the scale", () => {
    const x = p("prg-de-cs");
    x.requirements.minGrade = { status: "required", value: { value: 5, scale: 4 } };
    expect(validateProgram(x).minGrade).toBeDefined();
  });

  it("does not accept 'required' with no accepted tests", () => {
    const x = p("prg-de-cs");
    x.requirements.languageTests = { status: "required", value: [] };
    expect(validateProgram(x).languageTests).toMatch(/Unknown/);
  });

  it("needs a deadline date for a fixed deadline", () => {
    const x = p("prg-de-cs");
    x.intakes[0].deadline = { kind: "fixed", date: "", type: "university", dateOnly: true };
    expect(validateProgram(x).intake0).toMatch(/deadline date/);
  });
});
