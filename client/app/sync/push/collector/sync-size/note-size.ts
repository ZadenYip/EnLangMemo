import type { NotePayload } from "@enlangmemo/sync-api";
import { int32Size, int64Size, uuidSize } from "./constants.js";
import { utf8ByteLength } from "./sync-change-size.js";

/**
 * Fixed decoded size for a note UPSERT change, excluding fieldsJson.
 * entityId(UUID) + noteTypeId(UUID) + usn(int64) + createdAt(int64)
 * + updatedAt(int64) + senseId(int32)
 */
const noteFixedSize =
    uuidSize +
    uuidSize +
    int64Size +
    int64Size +
    int64Size +
    int32Size

/** Estimate decoded size for a note UPSERT change. */
export function estimateNoteChangeSize(payload: NotePayload): number {
    return noteFixedSize + utf8ByteLength(payload.fieldsJson);
}
