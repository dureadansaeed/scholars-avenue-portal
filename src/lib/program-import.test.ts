import { describe, expect, it } from "vitest";
import { parseCsv, toCsv } from "@/lib/csv";
import { autoMap, missingRequired, SAMPLE_CSV, validateImport } from "@/lib/program-import";
import { cities, programs, universities } from "@/mocks/catalog";

let n = 0;
const id = (p: string) => `${p}-t${++n}`;
const run = (csv: string) => {
  const [header, ...rows] = parseCsv(csv);
  return validateImport(rows, autoMap(header), { universities, cities, programs }, id, "imp-test");
};

describe("csv", () => {
  it("handles quotes, commas and newlines in fields", () => {
    expect(parseCsv('a,"b, c","d ""e""\nf"\r\n1,2,3')).toEqual([["a", "b, c", 'd "e"\nf'], ["1", "2", "3"]]);
  });
  it("round-trips and neutralises formula cells on export", () => {
    expect(toCsv([["x", "=SUM(A1)", 'he said "hi"']])).toBe(`x,'=SUM(A1),"he said ""hi"""`);
  });
});

describe("programme import", () => {
  it("maps the template headers automatically", () => {
    const [header] = parseCsv(SAMPLE_CSV);
    expect(missingRequired(autoMap(header))).toEqual([]);
  });

  it("classifies every row of the sample file", () => {
    const r = run(SAMPLE_CSV);
    expect(r.map((x) => x.result)).toEqual(["valid", "conflict", "valid", "duplicate", "error", "conflict"]);
  });

  it("imports as pending review with the batch recorded, never verified", () => {
    const p = run(SAMPLE_CSV)[0].program!;
    expect(p.status).toBe("pending_review");
    expect(p.source.lastCheckedAt).toBeNull();
    expect(p.importBatchId).toBe("imp-test");
  });

  it("leaves blank requirements unknown and a blank deadline not published", () => {
    const p = run(SAMPLE_CSV)[2].program!;
    expect(p.requirements.minGrade.status).toBe("unknown");
    expect(p.requirements.languageTests.status).toBe("unknown");
    expect(p.intakes[0].deadline.kind).toBe("rolling");
  });

  it("refuses a grade without its scale", () => {
    const r = run(SAMPLE_CSV)[4];
    expect(r.message).toMatch(/never assumed/);
    expect(r.message).toMatch(/not in the catalog/);
  });

  it("flags a clash with the catalog instead of overwriting it", () => {
    expect(run(SAMPLE_CSV)[5].message).toMatch(/Deadline differs/);
  });
});
