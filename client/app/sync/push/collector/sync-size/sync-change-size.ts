import { ChangeOp } from "@enlangmemo/sync-api";
import type { SyncChange } from "@enlangmemo/sync-api";
import { deletedChangeSize } from "./constants.js";
import { estimateCardChangeSize as estCardChangeSize } from "./card-size.js";
import { estimateCollectionChangeSize as estCollectionChangeSize } from "./collection-size.js";
import { estimateDeckChangeSize as estDeckChangeSize } from "./deck-size.js";
import { estimateNoteChangeSize as estChangeSize } from "./note-size.js";
import { estimateNoteTypeChangeSize as estNoteTypeChangeSize } from "./note-type-size.js";
import { estimateProcessingNoteChangeSize as estProcessingNoteChangeSize } from "./processing-note-size.js";
import { estimateReviewLogChangeSize as estReviewLogChangeSize } from "./review-log-size.js";

/**
 * estimate the size of a sync change
 * @param change 
 * @returns the estimated size of the sync change in bytes
 */
export function estSyncChangeSize(change: SyncChange): number {
    if (change.op === ChangeOp.DELETE) {
        return deletedChangeSize;
    }

    switch (change.payload.case) {
        case "reviewLog":
            return estReviewLogChangeSize();
        case "card":
            return estCardChangeSize();
        case "note":
            return estChangeSize(change.payload.value);
        case "processingNote":
            return estProcessingNoteChangeSize(change.payload.value);
        case "noteType":
            return estNoteTypeChangeSize(change.payload.value);
        case "deck":
            return estDeckChangeSize(change.payload.value);
        case "collection":
            return estCollectionChangeSize(change.payload.value);
        case undefined:
            throw new Error(`estimateSyncChangesSize meet undefined payload case for change: ${JSON.stringify(change)}`);
    }
}


export function utf8ByteLength(value: string | undefined): number {
    return Buffer.byteLength(value ?? "", "utf8");
}

export function bytesLength(value: Uint8Array | undefined): number {
    return value?.byteLength ?? 0;
}
