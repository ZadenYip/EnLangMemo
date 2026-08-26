import type { NoteTypePayload } from "@enlangmemo/sync-api";
import { int32Size, int64Size, uuidSize } from "./constants.js";
import { utf8ByteLength } from "./sync-change-size.js";

/**
 * Fixed decoded size for a note-type UPSERT change, excluding name and noteTemplateJson.
 * entityId(UUID) + usn(int64) + presetTemplateId(int32) + updatedAt(int64)
 */
const noteTypeFixedSize =
    uuidSize +
    int64Size +
    int32Size +
    int64Size

/** Estimate decoded size for a note-type UPSERT change. */
export function estimateNoteTypeChangeSize(payload: NoteTypePayload): number {
    return noteTypeFixedSize + utf8ByteLength(payload.name) + utf8ByteLength(payload.noteTemplateJson);
}
