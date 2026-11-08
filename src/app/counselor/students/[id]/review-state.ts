"use client";

import { DEMO_NOW } from "@/lib/clock";
import { useLocalState } from "@/lib/use-local-state";
import type { DocumentStatus, FieldReview, StudentDocument } from "@/types";

/**
 * A counselor's review decisions for one student, kept in this browser until a
 * backend exists. Layered over the mock record: the effective value is the
 * overlay if there is one, otherwise the record. (Student-side pages do not read
 * it yet, so a decision made here is not visible to the student in this demo.)
 */
export interface ReviewOverlay {
  reviews: Record<string, FieldReview>;
  docs: Record<string, { status: DocumentStatus; reason?: string; reviewedAt: string; reviewedBy: string }>;
  requests: StudentDocument[];
  log: { at: string; by: string; text: string }[];
}
const EMPTY: ReviewOverlay = { reviews: {}, docs: {}, requests: [], log: [] };

export function useReviewOverlay(studentId: string, counselorId: string) {
  const [o, set] = useLocalState<ReviewOverlay>(`sa:cns:review:${studentId}`, EMPTY);

  const record = (text: string) => ({ at: DEMO_NOW, by: counselorId, text });

  return {
    overlay: o,
    review(key: string, label: string, status: FieldReview["status"], base: FieldReview | undefined, note?: string) {
      set((cur) => ({
        ...cur,
        reviews: { ...cur.reviews, [key]: { status, reviewedBy: counselorId, reviewedAt: DEMO_NOW, note, previousValues: (cur.reviews[key] ?? base)?.previousValues } },
        log: [record(status === "verified" ? `Verified ${label}` : status === "correction_requested" ? `Requested a correction on ${label}${note ? `: ${note}` : ""}` : `Reset review of ${label}`), ...cur.log],
      }));
    },
    resetReview(key: string, label: string) {
      set((cur) => {
        const { [key]: _drop, ...rest } = cur.reviews;
        void _drop;
        return { ...cur, reviews: rest, log: [record(`Reset review of ${label}`), ...cur.log] };
      });
    },
    setDoc(docId: string, title: string, status: DocumentStatus, reason?: string) {
      set((cur) => ({
        ...cur,
        docs: { ...cur.docs, [docId]: { status, reason, reviewedAt: DEMO_NOW, reviewedBy: counselorId } },
        log: [record(`Marked "${title}" as ${status.replace(/_/g, " ")}${reason ? `: ${reason}` : ""}`), ...cur.log],
      }));
    },
    addRequest(doc: StudentDocument) {
      set((cur) => ({ ...cur, requests: [...cur.requests, doc], log: [record(`Requested "${doc.title}" (due ${doc.dueDate})`), ...cur.log] }));
    },
    logOnly(text: string) { set((cur) => ({ ...cur, log: [record(text), ...cur.log] })); },
  };
}
