import { describe, expect, it } from "vitest";
import { matchProgram, type StudentFacts } from "@/lib/eligibility";
import { programs } from "@/mocks/catalog";
import { academics, languageTests, otherTests, preferences } from "@/mocks/students";
import type { CriterionState } from "@/types";

const facts = (id: string): StudentFacts => ({
  preference: preferences.find((p) => p.studentId === id) ?? null,
  academics: academics.filter((a) => a.studentId === id),
  languageTests: languageTests.filter((t) => t.studentId === id),
  otherTests: otherTests.filter((t) => t.studentId === id),
});
const program = (id: string) => programs.find((p) => p.id === id)!;
const run = (student: string, prog: string, intakeIdx = 1) =>
  matchProgram(facts(student), program(prog), `${prog}-in${intakeIdx}`);
const state = (r: ReturnType<typeof run>, key: string): CriterionState => r.criteria.find((c) => c.key === key)!.state;

describe("matchProgram", () => {
  it("confirms only when every checked criterion is met on the record", () => {
    const r = run("stu-001", "prg-de-cs");
    expect(r.overall).toBe("confirmed");
    expect(r.criteria.every((c) => c.reason.length > 0)).toBe(true);
  });

  it("never compares grades on different scales", () => {
    // 3.4/5.0 against a 3.0/4.0 minimum must not be read as a pass.
    expect(state(run("stu-002", "prg-de-cs"), "grade")).toBe("needs_review");
    expect(run("stu-002", "prg-de-cs").criteria.find((c) => c.key === "grade")!.reason).toMatch(/not compared/i);
  });

  it("treats a missing grade or scale as unknown, not as a failure", () => {
    expect(state(run("stu-003", "prg-de-cs"), "grade")).toBe("unknown_student");
  });

  it("does not treat an unpublished deadline as open", () => {
    const r = run("stu-001", "prg-de-de");
    expect(state(r, "deadline")).toBe("unknown_program");
    expect(r.overall).toBe("possible");
  });

  it("labels missing language requirements incomplete, not unrestricted", () => {
    const r = run("stu-001", "prg-de-de");
    expect(state(r, "language_overall")).toBe("unknown_program");
    expect(state(r, "language_components")).toBe("unknown_program");
  });

  it("flags a passed deadline as a hard mismatch", () => {
    const r = run("stu-001", "prg-au-it");
    expect(state(r, "deadline")).toBe("does_not_meet");
    expect(r.overall).toBe("mismatch");
  });

  it("does not equate different language tests", () => {
    // stu-001 holds IELTS only; this programme accepts TOEFL only.
    const base = program("prg-de-cs");
    const toeflOnly = {
      ...base,
      requirements: { ...base.requirements, languageTests: { status: "required" as const, value: [{ testType: "toefl_ibt" as const, overall: 88, components: {} }] } },
    };
    const r = matchProgram(facts("stu-001"), toeflOnly, "prg-de-cs-in1");
    expect(state(r, "language_overall")).toBe("unknown_student");
  });

  it("compares component scores, not just the overall", () => {
    // stu-001 writing 6.5 < Amstelburg's 6.5? equal, so use a stricter fixture.
    const base = program("prg-nl-ds");
    const strict = {
      ...base,
      requirements: { ...base.requirements, languageTests: { status: "required" as const, value: [{ testType: "ielts_academic" as const, overall: 7.0, components: { writing: 7.0 } }] } },
    };
    const r = matchProgram(facts("stu-001"), strict, "prg-nl-ds-in1");
    expect(state(r, "language_overall")).toBe("meets");
    expect(state(r, "language_components")).toBe("does_not_meet");
    expect(r.overall).toBe("mismatch");
  });

  it("flags a test that expires before the deadline", () => {
    expect(state(run("stu-002", "prg-de-cs"), "validity")).toBe("does_not_meet");
  });

  it("reports a required test that is not on file as unknown for the student", () => {
    expect(state(run("stu-001", "prg-us-cs"), "other_tests")).toBe("unknown_student");
  });

  it("does not auto-reject for unverified program data", () => {
    const r = run("stu-001", "prg-fr-ai");
    expect(state(r, "freshness")).toBe("unknown_program");
    expect(r.overall).not.toBe("mismatch");
  });

  it("marks a verified but stale record for review", () => {
    expect(state(run("stu-001", "prg-se-ml"), "freshness")).toBe("needs_review");
  });
});
