import type { DeckPayload } from "@enlangmemo/sync-api";
import { int32Size, int64Size, uuidSize } from "./constants.js";
import { utf8ByteLength } from "./sync-change-size.js";

/**
 * Fixed decoded size for a deck UPSERT change, excluding name and configJson.
 * entityId(UUID) + usn(int64) + updatedAt(int64) + newCardsPerDay(int32)
 * + newLearnedToday(int32) + learnedToday(int32) + reviewedToday(int32)
 */
const deckFixedSize =
    uuidSize +
    int64Size +
    int64Size +
    int32Size +
    int32Size +
    int32Size +
    int32Size

/** Estimate decoded size for a deck UPSERT change. */
export function estimateDeckChangeSize(payload: DeckPayload): number {
    return deckFixedSize + utf8ByteLength(payload.name) + utf8ByteLength(payload.configJson);
}
