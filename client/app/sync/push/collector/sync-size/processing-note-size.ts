import type { ProcessingNotePayload } from "@enlangmemo/sync-api";
import { int32Size, int64Size, uuidSize } from "./constants.js";
import { utf8ByteLength } from "./sync-change-size.js";

/**
 * Fixed decoded size for a processing-note UPSERT change, excluding fieldsJson.
 * entityId(UUID) + noteTypeId(UUID) + usn(int64) + createdAt(int64)
 * + updatedAt(int64) + senseId(int32)
 */
const processingNoteFixedSize =
    uuidSize +
    uuidSize +
    int64Size +
    int64Size +
    int64Size +
    int32Size

/** Estimate decoded size for a processing-note UPSERT change. */
export function estimateProcessingNoteChangeSize(payload: ProcessingNotePayload): number {
    return processingNoteFixedSize + utf8ByteLength(payload.fieldsJson);
}
