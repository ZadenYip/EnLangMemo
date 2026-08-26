import { doubleSize, int32Size, int64Size, uuidSize } from "./constants.js";

/**
 * Fixed decoded size for a card UPSERT change.
 * entityId(UUID) + usn(int64) + noteId(UUID) + deckId(UUID) + updatedAt(int64)
 * + difficulty(double) + stability(double) + scheduledDays(int32) + due(int64)
 * + lastReview(int64) + lapses(int32) + learningSteps(int32) + repetitions(int32)
 * + state(int32) + queue(int32)
 */
const cardFixedSize =
    uuidSize +
    int64Size +
    uuidSize +
    uuidSize +
    int64Size +
    doubleSize +
    doubleSize +
    int32Size +
    int64Size +
    int64Size +
    int32Size +
    int32Size +
    int32Size +
    int32Size +
    int32Size

export function estimateCardChangeSize(): number {
    return cardFixedSize;
}
