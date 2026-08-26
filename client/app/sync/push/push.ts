import { create } from "@bufbuild/protobuf";
import { EntityType, PushRequestSchema } from "@enlangmemo/sync-api";
import { getClient } from "../index.js";
import { clearSyncSession, getSyncSessionOrThrow, resetPushQueue, timeoutMs, type SyncSession } from "../session.js";
import { type CollectResult, PushCollector } from "./collector/collector.js";
import { zeroUuid } from "./collector/sync-size/constants.js";
import { TombstoneType, type SyncEntityType } from "./push-queue.js";
import { ConnectError } from "@connectrpc/connect";
import { mapRpcErrorCode } from "../error/rpc-error-code.js";
import Logger from "electron-log";
import { PushBatchResult as PushViewResult } from "./push-types.js";
import { Observable } from "rxjs";

export function push$(): Observable<PushViewResult> {
    return new Observable<PushViewResult>((subscriber) => {
        const run = async () => {
            resetPushQueue();
            while (true) {
                const session = getSyncSessionOrThrow();
                if (session.queue!.isEmpty()) {
                    return;
                }

                try {
                    const result = await pushBatch(session);
                    subscriber.next({
                        kind: "success",
                        changes: result.changes,
                        lastBatch: result.lastBatch,
                    });
                    if (result.lastBatch) {
                        Logger.info("push complete, clearing sync session.");
                        clearSyncSession();
                        subscriber.complete();
                        return;
                    }
                } catch (error) {
                    clearSyncSession();
                    Logger.error("push failed", error);
                    if (error instanceof ConnectError) {
                        Logger.error(
                            "push rpc failed",
                            mapRpcErrorCode(error.code),
                            error.rawMessage,
                        );
                        subscriber.next({
                            kind: "rpc_error",
                            code: mapRpcErrorCode(error.code),
                            message: error.rawMessage,
                        });
                        return;
                    } else {
                        subscriber.error();
                    }
                    return;
                }

                // Rebuild the queue after each acknowledged batch. Note cascade push may
                // confirm its related card/review-log rows, so the old queue can point at
                // entity types that no longer have unsynced changes.
                resetPushQueue();
            }
        };

        void run();

        return () => {
            Logger.info("push subscription unsubscribed, clearing sync session.");
            clearSyncSession();
        };
    });
}

interface CollectBatchResult {
    changes: number;
    lastBatch: boolean;
}
async function pushBatch(session: SyncSession): Promise<CollectBatchResult> {
    const c = new PushCollector();
    const result = collectPushBatch(session, c);

    if (c.changes.length === 0) {
        throw new Error("push collector produced empty batch.");
    }

    const response = await getClient().push(
        create(PushRequestSchema, {
            sessionId: session.sessionId,
            batchSeq: session.batchSeq,
            changes: c.changes,
            lastBatch: result.lastBatch,
        }),
        { timeoutMs: timeoutMs },
    );

    if (response.batchSeq !== session.batchSeq) {
        throw new Error(`push batchSeq mismatch: expected ${session.batchSeq}, got ${response.batchSeq}`);
    }

    c.response(response);
    Logger.info(`push batch ${session.batchSeq} acknowledged with ${c.changes.length} changes.`);
    session.batchSeq += 1;
    return result;
}

function collectPushBatch(
    session: SyncSession,
    collector: PushCollector,
): CollectBatchResult {
    const queue = session.queue!;
    // This cursor only lives inside the current batch. After the batch is
    // acknowledged, assigned USNs remove those rows from later usn=-1 queries.
    let cursorId = zeroUuid;

    while (!queue.isEmpty()) {
        const entityType = queue.peek()!;

        const result = collectByType(collector, entityType, cursorId);
        cursorId = result.nextStartAfterId;

        if (entityType === EntityType.NOTE) {
            // Note changes are collected with their related card/review-log rows,
            // so keep collecting notes while this batch still has capacity.
            if (!result.sizeExceeded && result.hasMore) {
                continue;
            }

            if (!result.hasMore) {
                // cases: sizeExceeded=false && hasMore=false and
                // sizeExceeded=true && hasMore=false
                queue.pop();
                cursorId = zeroUuid;
            }
            break;
        }

        // Keep the four result cases explicit to mirror the server pull state machine.
        if (result.sizeExceeded) {
            if (result.hasMore) {
                break;
            } else {
                queue.pop();
                cursorId = zeroUuid;
                break;
            }
        } else {
            if (result.hasMore) {
                continue;
            } else {
                queue.pop();
                cursorId = zeroUuid;
            }
        }
    }

    return {
        changes: collector.changes.length,
        lastBatch: queue.isEmpty(),
    };
}

function collectByType(
    collector: PushCollector,
    entityType: SyncEntityType,
    startAfterId: Buffer,
): CollectResult {
    switch (entityType) {
        case EntityType.REVIEW_LOG:
            return collector.collectReviewLogChanges(startAfterId);
        case EntityType.CARD:
            return collector.collectCardChanges(startAfterId);
        case EntityType.NOTE:
            return collector.collectNoteCascadeChanges(startAfterId);
        case TombstoneType:
            return collector.collectTombstoneChanges(startAfterId);
        case EntityType.PROCESSING_NOTE:
            return collector.collectProcessingNoteChanges(startAfterId);
        case EntityType.NOTE_TYPE:
            return collector.collectNoteTypeChanges(startAfterId);
        case EntityType.DECK:
            return collector.collectDeckChanges(startAfterId);
        case EntityType.COLLECTION:
            return collector.collectColChange();
        default:
            throw new Error(`unsupported push entity type: ${entityType}`);
    }
}
