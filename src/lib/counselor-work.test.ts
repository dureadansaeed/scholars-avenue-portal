import { describe, expect, it } from "vitest";
import { mergeById, SHORTLIST_NEXT } from "@/lib/counselor-work";
import type { ShortlistStatus } from "@/types";

describe("counselor work overlay", () => {
  it("lets an overlay copy replace the base and appends overlay-only records", () => {
    const base = [{ id: "a", v: 1 }, { id: "b", v: 1 }];
    const merged = mergeById(base, { b: { id: "b", v: 2 }, c: { id: "c", v: 9 } });
    expect(merged).toEqual([{ id: "a", v: 1 }, { id: "b", v: 2 }, { id: "c", v: 9 }]);
  });

  it("covers every shortlist status and never offers a self-transition", () => {
    const all: ShortlistStatus[] = ["proposed_internally", "shared", "under_discussion", "student_approved", "student_declined", "unsuitable", "application_created", "removed"];
    for (const s of all) {
      expect(SHORTLIST_NEXT[s]).toBeDefined();
      expect(SHORTLIST_NEXT[s]).not.toContain(s);
    }
  });

  it("only reaches 'application created' through creating an application", () => {
    for (const s of Object.keys(SHORTLIST_NEXT) as ShortlistStatus[]) expect(SHORTLIST_NEXT[s]).not.toContain("application_created");
    expect(SHORTLIST_NEXT.application_created).toEqual([]);
  });

  it("does not let an unshared proposal be marked as the student's decision", () => {
    expect(SHORTLIST_NEXT.proposed_internally).not.toContain("student_approved");
    expect(SHORTLIST_NEXT.proposed_internally).not.toContain("student_declined");
  });
});
