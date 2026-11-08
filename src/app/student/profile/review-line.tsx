import { VerificationBadge } from "@/components/ui/chips";
import { formatDate } from "@/lib/clock";
import type { FieldReview } from "@/types";

/** Review state of a field, with the counselor's reason and any earlier values. */
export function ReviewLine({ review, reviewerNames }: { review?: FieldReview; reviewerNames: Record<string, string> }) {
  if (!review) return null;
  const who = review.reviewedBy ? reviewerNames[review.reviewedBy] : undefined;
  return (
    <div className="mt-1.5 space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <VerificationBadge status={review.status} />
        {review.reviewedAt && review.status !== "unverified" && (
          <span className="text-tiny text-n-500">{who ? `${who}, ` : ""}{formatDate(review.reviewedAt)}</span>
        )}
      </div>
      {review.status === "correction_requested" && review.note && (
        <p className="text-tiny leading-relaxed text-bad-400">{review.note}</p>
      )}
      {review.previousValues && review.previousValues.length > 0 && (
        <details className="text-tiny text-n-400">
          <summary className="cursor-pointer text-n-500 hover:text-n-100">Earlier values ({review.previousValues.length})</summary>
          <ul className="mt-1 space-y-0.5">
            {review.previousValues.map((p) => (
              <li key={p.changedAt + p.value} className="tabular-nums">{p.value} <span className="text-n-500">· replaced {formatDate(p.changedAt)}</span></li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
