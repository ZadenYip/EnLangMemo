import { ChangeOp, EntityType } from "@enlangmemo/sync-api";
import type { PushResponse, SyncChange } from "@enlangmemo/sync-api";
import { getRepDb } from "@main/db/db.js";
import { maxSyncBatchSize, syncEntityLimits } from "./sync-size/constants.js";
import { estSyncChangeSize } from "./sync-size/sync-change-size.js";
import Logger from "electron-log/main.js";
import { assignDeckUsn, getDeckChanges, toDeckSyncChange } from "./change/deck.js";
import { assignColUsn, getColChange, updateCliSyncCursor } from "./change/collection.js";
import { assignNoteTypeUsn, getNoteTypeChangeRows, toNoteTypeSyncChange } from "./change/note-type.js";
import { assignNoteUsn, getNoteChanges, getUnsyncedNoteCascade, toNoteSyncChange } from "./change/note.js";
import { assignCardUsn, getCardChanges, toCardSyncChange } from "./change/card.js";
import { assignReviewLogUsn, getReviewChanges, toReviewLogSyncChange } from "./change/review-log.js";
import { assignPcsUsn, getPcsChanges, toPcsSyncChange } from "./change/processing-note.js";
import { deleteSyncedTombstone, getTombstoneChanges, toTombstoneSyncChange } from "./change/tombstone.js";
import type { RepTx } from "@main/db/services/repetition/helper/type.js";
import { toInt } from "@main/sync/helper/type.js";

export interface CollectResult {
    /** Whether there are more rows remaining after this collection pass. */
    hasMore: boolean;
    /** Whether collection stopped because the estimated decoded batch size limit was reached. */
    sizeExceeded: boolean;
    /** ID cursor to use as the exclusive lower bound for the next collect pass. */
    nextStartAfterId: Buffer;
    /** Entity type cursor used by tombstone collection order. */
    nextStartUnitType?: EntityType;
}

export class PushCollector {
    /** Soft limit for the maximum estimated decoded batch size in bytes. */
    private readonly maxBatchSize = maxSyncBatchSize;

    /** Collected sync changes for the current push batch. */
    changes: SyncChange[] = [];

    /** Current estimated decoded batch size in bytes. */
    private curSize = 0;

    /**
     * Adds a SyncChange to the current push batch.
     * 
     * @param changes - The SyncChanges to add to the current push batch.
     * @returns True if the change was added to the batch, false if the batch size limit was exceeded and the change was not added.
     */
    private addChange(changes: SyncChange[]): boolean {
        let changesSize = 0;
        for (const c of changes) {
            const size = estSyncChangeSize(c);
            changesSize += size;
        }

        if (this.curSize + changesSize > this.maxBatchSize) {
            return false;
        }

        this.changes.push(...changes);
        this.curSize += changesSize;
        return true;
    }

    collectColChange(): CollectResult {
        const row = getColChange();
        if (!row) {
            Logger.error("no pending collection change found in collectColChange");
            throw new Error("no pending collection change found.");
        }

        if (!this.addChange([row])) {
            Logger.error(
                `collection change exceeds max batch size, 
                cannot add to push batch. 
                It shouldn't happen because collection change is collected first 
                and should be small enough to fit in a batch.`,
            );
            throw new Error("collection change exceeds max batch size, cannot add to push batch.");
        }
        
        return {
            hasMore: false,
            sizeExceeded: false,
            nextStartAfterId: Buffer.from(row.entityId),
        };
    }

    /** Collect pending local deck UPSERT changes into the current push batch. */
    collectDeckChanges(startAfterId: Buffer): CollectResult {
        const limit = syncEntityLimits.deck;
        const rows = getDeckChanges(limit + 1, startAfterId);
        const result: CollectResult = {
            hasMore: rows.length > limit,
            sizeExceeded: false,
            nextStartAfterId: startAfterId,
        };

        for (const row of rows.slice(0, limit)) {
            const change = toDeckSyncChange(row);
            if (!this.addChange([change])) {
                result.hasMore = true;
                result.sizeExceeded = true;
                break;
            }
            result.nextStartAfterId = row.id;
        }

        return result;
    }

    /** Collect pending local note-type UPSERT changes into the current push batch. */
    collectNoteTypeChanges(startAfterId: Buffer): CollectResult {
        const limit = syncEntityLimits.noteType;
        const rows = getNoteTypeChangeRows(limit + 1, startAfterId);
        const result: CollectResult = {
            hasMore: rows.length > limit,
            sizeExceeded: false,
            nextStartAfterId: startAfterId,
        };

        for (const row of rows.slice(0, limit)) {
            const change = toNoteTypeSyncChange(row);
            if (!this.addChange([change])) {
                result.hasMore = true;
                result.sizeExceeded = true;
                break;
            }
            result.nextStartAfterId = row.id;
        }

        return result;
    }

    collectNoteCascadeChanges(startAfterId: Buffer): CollectResult {
        const limit = syncEntityLimits.note;
        const rows = getNoteChanges(limit + 1, startAfterId);
        const result: CollectResult = {
            hasMore: rows.length > limit,
            sizeExceeded: false,
            nextStartAfterId: startAfterId,
        };

        for (const row of rows.slice(0, limit)) {
            const cascade = getUnsyncedNoteCascade(row);
            
            const noteChange = toNoteSyncChange(row)
            const cardChange = cascade.card === null ? [] : [toCardSyncChange(cascade.card)]; 
            const reviewChanges = cascade.reviewLogs.map((log) => toReviewLogSyncChange(log));
            
            if (!this.addChange([noteChange,...cardChange, ...reviewChanges])) {
                result.hasMore = true;
                result.sizeExceeded = true;
                break;
            }
            result.nextStartAfterId = row.id;
        }

        return result;
    }

    collectProcessingNoteChanges(startAfterId: Buffer): CollectResult {
        const limit = syncEntityLimits.processingNote;
        const rows = getPcsChanges(limit + 1, startAfterId);
        const result: CollectResult = {
            hasMore: rows.length > limit,
            sizeExceeded: false,
            nextStartAfterId: startAfterId,
        };

        for (const row of rows.slice(0, limit)) {
            const change = toPcsSyncChange(row);
            if (!this.addChange([change])) {
                result.hasMore = true;
                result.sizeExceeded = true;
                break;
            }
            result.nextStartAfterId = row.id;
        }

        return result;
    }

    collectCardChanges(startAfterId: Buffer): CollectResult {
        const limit = syncEntityLimits.card;
        const rows = getCardChanges(limit + 1, startAfterId);
        const result: CollectResult = {
            hasMore: rows.length > limit,
            sizeExceeded: false,
            nextStartAfterId: startAfterId,
        };

        for (const row of rows.slice(0, limit)) {
            const change = toCardSyncChange(row);
            if (!this.addChange([change])) {
                result.hasMore = true;
                result.sizeExceeded = true;
                break;
            }
            result.nextStartAfterId = row.id;
        }

        return result;
    }

    collectReviewLogChanges(startAfterId: Buffer): CollectResult {
        const limit = syncEntityLimits.reviewLog;
        const rows = getReviewChanges(limit + 1, startAfterId);
        const result: CollectResult = {
            hasMore: rows.length > limit,
            sizeExceeded: false,
            nextStartAfterId: startAfterId,
        };

        for (const row of rows.slice(0, limit)) {
            const change = toReviewLogSyncChange(row);
            if (!this.addChange([change])) {
                result.hasMore = true;
                result.sizeExceeded = true;
                break;
            }
            result.nextStartAfterId = row.id;
        }

        return result;
    }

    collectTombstoneChanges(startUnitType: EntityType, startAfterId: Buffer): CollectResult {
        const limit = syncEntityLimits.tombstone;
        const rows = getTombstoneChanges(limit + 1, startUnitType, startAfterId);
        const result: CollectResult = {
            hasMore: rows.length > limit,
            sizeExceeded: false,
            nextStartAfterId: startAfterId,
        };

        for (const row of rows.slice(0, limit)) {
            const change = toTombstoneSyncChange(row);
            if (!this.addChange([change])) {
                result.hasMore = true;
                result.sizeExceeded = true;
                break;
            }
            result.nextStartUnitType = row.unitType as EntityType;
            result.nextStartAfterId = row.unitId;
        }

        return result;
    }

    response(resp: PushResponse): void {
        if (resp.changes.length != this.changes.length) {
            Logger.error(
                `push response changes length ${resp.changes.length} does not match request changes length ${this.changes.length}`,
            );
            throw new Error(
                "push response changes length does not match request changes length",
            );
        }

        let cursorUsn = 0;
        getRepDb().transaction((tx) => {
            for (let i = 0; i < resp.changes.length; i++) {
                const respChange = resp.changes[i];
                const reqChange = this.changes[i];

                if (!sameBytes(respChange.entityId, reqChange.entityId)) {
                    Logger.error(
                        `push response change entityId ${Buffer.from(respChange.entityId).toString("hex")} does not match request change entityId ${Buffer.from(reqChange.entityId).toString("hex")}`,
                    );
                    throw new Error(
                        "push response change entityId does not match request change entityId",
                    );
                }

                if (respChange.entityType !== reqChange.entityType) {
                    Logger.error(
                        `push response change entityType ${respChange.entityType} does not match request change entityType ${reqChange.entityType}`,
                    );
                    throw new Error(
                        "push response change entityType does not match request change entityType",
                    );
                }

                if (respChange.op !== ChangeOp.ASSIGN_USN) {
                    Logger.error(
                        `push response change op ${respChange.op} is not ASSIGN_USN`,
                    );
                    throw new Error(
                        "push response change op is not ASSIGN_USN",
                    );
                }
                cursorUsn = Math.max(cursorUsn, toInt(respChange.usn));
                assignLocalUsn(tx, reqChange.op, respChange.entityType, Buffer.from(respChange.entityId), toInt(respChange.usn));
            }
            updateCliSyncCursor(tx, cursorUsn + 1);
        });
        Logger.info(`push response processed successfully, assigned USN up to ${cursorUsn}, updated collection sync cursor to ${cursorUsn + 1}`);

        // clear the changes after processing the response
        this.changes = [];
        this.curSize = 0;
    }
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
    return Buffer.compare(Buffer.from(left), Buffer.from(right)) === 0;
}

function assignLocalUsn(tx: RepTx, originOp: ChangeOp, type: EntityType, id: Buffer, usn: number): void {
    if (originOp === ChangeOp.DELETE) {
        deleteSyncedTombstone(tx, id);
        return;
    }

    switch (type) {
        case EntityType.COLLECTION:
            assignColUsn(tx, id, usn);
            return;
        case EntityType.DECK:
            assignDeckUsn(tx, id, usn);
            return;
        case EntityType.NOTE_TYPE:
            assignNoteTypeUsn(tx, id, usn);
            return;
        case EntityType.PROCESSING_NOTE:
            assignPcsUsn(tx, id, usn);
            return;
        case EntityType.NOTE:
            assignNoteUsn(tx, id, usn);
            return;
        case EntityType.CARD:
            assignCardUsn(tx, id, usn);
            return;
        case EntityType.REVIEW_LOG:
            assignReviewLogUsn(tx, id, usn);
            return;
        default:
            throw new Error(`unsupported push response entity type: ${type}`);
    }
}
