import { describe, expect, it } from "vitest";
import { defaultChecklist, isActive, proportionalEstimate, statusGroup, TRANSITIONS, validateTransition } from "@/lib/application-rules";
import { programs } from "@/mocks/catalog";
import type { TransitionInput } from "@/lib/application-rules";

const base: TransitionInput = { from: "ready_for_submission", to: "submitted", evidenceCount: 0, studentConfirmed: true, requireConfirmation: true };

describe("application workflow", () => {
  it("allows only listed transitions", () => {
    expect(validateTransition({ ...base, from: "planned", to: "submitted", evidenceCount: 1 }).ok).toBe(false);
    expect(validateTransition({ ...base, from: "planned", to: "requirements_review" }).ok).toBe(true);
  });

  it("refuses Submitted without evidence or a reason none exists", () => {
    const r = validateTransition(base);
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/evidence/i);
    expect(validateTransition({ ...base, evidenceUnavailableReason: "Portal gave no receipt" }).ok).toBe(true);
    expect(validateTransition({ ...base, evidenceCount: 1 }).ok).toBe(true);
  });

  it("requires a reason for terminal outcomes", () => {
    expect(validateTransition({ ...base, from: "under_university_review", to: "rejected", evidenceCount: 0 }).ok).toBe(false);
    expect(validateTransition({ ...base, from: "under_university_review", to: "rejected", reason: "Declined by university" }).ok).toBe(true);
  });

  it("needs the student's confirmation before submission unless an override reason is recorded", () => {
    const unconfirmed = { ...base, from: "awaiting_student_confirmation" as const, to: "ready_for_submission" as const, studentConfirmed: false };
    expect(validateTransition(unconfirmed).ok).toBe(false);
    expect(validateTransition({ ...unconfirmed, confirmationOverrideReason: "Student confirmed by phone" }).ok).toBe(true);
    expect(validateTransition({ ...unconfirmed, requireConfirmation: false }).ok).toBe(true);
  });

  it("allows a resubmission after additional documents are requested", () => {
    expect(TRANSITIONS.additional_documents_requested).toContain("submitted");
  });

  it("every status has a transition entry, and closed is final", () => {
    expect(Object.keys(TRANSITIONS)).toHaveLength(22);
    expect(TRANSITIONS.closed).toEqual([]);
    expect(isActive("closed")).toBe(false);
    expect(statusGroup("offer_received")).toBe("decision");
  });

  it("builds a checklist from the programme and keeps unknown language rules visible", () => {
    const known = defaultChecklist("a1", programs.find((p) => p.id === "prg-de-cs")!, undefined);
    expect(known.some((i) => i.label === "Language test report")).toBe(true);
    const unknown = defaultChecklist("a2", programs.find((p) => p.id === "prg-de-de")!, undefined);
    expect(unknown.some((i) => /confirm what is accepted/.test(i.label))).toBe(true);
    const us = defaultChecklist("a3", programs.find((p) => p.id === "prg-us-cs")!, undefined);
    expect(us.some((i) => i.label.startsWith("GRE"))).toBe(true);
  });

  it("estimates a grade by simple proportion and shows the formula", () => {
    const e = proportionalEstimate(3.4, 5, 4);
    expect(e.value).toBe(2.72);
    expect(e.formula).toContain("÷");
  });
});
