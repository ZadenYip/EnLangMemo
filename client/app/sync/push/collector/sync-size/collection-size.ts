import type { CollectionPayload } from "@enlangmemo/sync-api";
import { int32Size, int64Size, uuidSize } from "./constants.js";
import { utf8ByteLength } from "./sync-change-size.js";

/**
 * Fixed decoded size for a collection UPSERT change, excluding configJson.
 * entityId(UUID) + usn(int64) + sqliteSchemaVersion(int32) + createdAt(int64) + updatedAt(int64)
 */
const collectionFixedSize =
    uuidSize +
    int64Size +
    int32Size +
    int64Size +
    int64Size;

/** Estimate decoded size for a collection UPSERT change. */
export function estimateCollectionChangeSize(payload: CollectionPayload): number {
    return collectionFixedSize + utf8ByteLength(payload.configJson);
}
