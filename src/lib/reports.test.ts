import { describe, expect, it } from "vitest";
import { breakdown, inWindow, isFinal, outcomes } from "@/lib/reports";
import type { ApplicationStatus } from "@/types";

const a = (status: ApplicationStatus, country: string) => ({ status, country });

describe("reports", () => {
  it("keeps pending and final outcomes apart", () => {
    const rows = breakdown([a("submitted", "DE"), a("rejected", "DE"), a("offer_received", "NL")], (x) => x.country, (k) => k);
    expect(rows[0]).toMatchObject({ key: "DE", total: 2, pending: 1, final: 1 });
    expect(rows[1]).toMatchObject({ key: "NL", total: 1, pending: 1, final: 0 });
  });

  it("treats an offer not yet accepted or declined as pending", () => {
    expect(isFinal("offer_received")).toBe(false);
    expect(isFinal("offer_accepted")).toBe(true);
  });

  it("labels a missing value as not recorded instead of dropping it", () => {
    expect(breakdown([a("planned", "")], (x) => x.country, (k) => k)[0].label).toBe("Not recorded");
  });

  it("applies an inclusive date window and excludes undated items once bounded", () => {
    expect(inWindow("2026-10-01", "2026-10-01", "2026-10-31")).toBe(true);
    expect(inWindow("2026-11-01", "2026-10-01", "2026-10-31")).toBe(false);
    expect(inWindow(null, "2026-10-01", "")).toBe(false);
    expect(inWindow(null, "", "")).toBe(true);
  });

  it("counts outcomes", () => {
    expect(outcomes(["offer_accepted", "rejected", "submitted", "withdrawn"])).toEqual({ offers: 1, accepted: 1, rejected: 1, withdrawn: 1, pending: 1 });
  });
});
