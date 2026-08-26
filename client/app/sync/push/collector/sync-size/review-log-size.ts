import { doubleSize, int32Size, int64Size, uuidSize } from "./constants.js";

/**
 * Fixed decoded size for a review-log UPSERT change.
 * entityId(UUID) + usn(int64) + cardId(UUID) + reviewTime(int64) + scheduledDays(int32)
 * + rating(int32) + difficulty(double) + stability(double) + learningSteps(int32)
 * + state(int32) + duration(int32)
 */
const reviewLogFixedSize =
    uuidSize +
    int64Size +
    uuidSize +
    int64Size +
    int32Size +
    int32Size +
    doubleSize +
    doubleSize +
    int32Size +
    int32Size +
    int32Size;

/** Estimate decoded size for a review-log UPSERT change. */
export function estimateReviewLogChangeSize(): number {
    return reviewLogFixedSize;
}
