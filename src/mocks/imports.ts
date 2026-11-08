import type { ImportBatch } from "@/types";

// SAMPLE DATA: earlier import batches, so the history is not empty.
export const importBatches: ImportBatch[] = [
  {
    id: "imp-001", filename: "programmes-germany-sept-2026.csv", importedBy: "adm-1", importedAt: "2026-09-18T10:20:00Z", applied: 2,
    rows: [
      { row: 2, name: "MSc Computer Science, Spreeland Technical University", result: "valid" },
      { row: 3, name: "MSc Data Engineering, Isarbrück University of Applied Sciences", result: "valid" },
      { row: 4, name: "MSc Robotics, Spreeland Technical University", result: "error", message: "Grade scale missing for a minimum grade of 2.5." },
      { row: 5, name: "MSc Computer Science, Spreeland Technical University", result: "duplicate", message: "Same as row 2." },
    ],
  },
  {
    id: "imp-002", filename: "nordics-update.csv", importedBy: "adm-1", importedAt: "2026-10-04T08:05:00Z", applied: 0,
    rows: [
      { row: 2, name: "MSc Machine Learning, Nordhaven Institute of Technology", result: "conflict", message: "Deadline differs from the catalog (2027-01-15 vs 2027-02-01). Review before applying." },
      { row: 3, name: "MSc Computer Science, Unknown University", result: "error", message: "University not in the catalog. Add it first." },
    ],
  },
];
