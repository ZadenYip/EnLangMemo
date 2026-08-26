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
import { Observable } from "rxjs";
import { PushBatchResult } from "./push-types.js";

export function push$(): Observable<PushBatchResult> {
    return new Observable<PushBatchResult>((subscriber) => {

        const run = async () => {
            while (true) {
                try {
                    resetPushQueue();
                    const session = getSyncSessionOrThrow();
                    if (session.queue!.isEmpty()) {
                        await finishPush(session);
                        subscriber.next({
                            kind: "success",
                            changes: 0,
                            lastBatch: true,
                        });
                        Logger.info("push phase finished, send complete to renderer.");
                        subscriber.complete();
                        return;
                    }

                    const changeCount = await pushBatch(session);
                    subscriber.next({
                        kind: "success",
                        changes: changeCount,
                        lastBatch: false,
                    });
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
                        subscriber.complete();
                        return;
                    } else {
                        subscriber.error();
                    }
                    return;
                }
            }
        };

        void run();

        return () => {
            Logger.info("push observable unsubscribed.");
        };
    });
}

async function finishPush(session: SyncSession): Promise<void> {
    const response = await getClient().push(
        create(PushRequestSchema, {
            sessionId: session.sessionId,
            batchSeq: session.batchSeq,
            finishPush: true
        }),
        { timeoutMs: timeoutMs },
    );

    if (response.batchSeq !== session.batchSeq) {
        throw new Error(`finish-push batchSeq mismatch: expected ${session.batchSeq}, got ${response.batchSeq}`);
    }

    session.status = "FINISHING";
    session.batchSeq += 1;
}

/**
 * @returns the number of changes collected in this batch.
 */
async function pushBatch(session: SyncSession): Promise<number> {
    const c = new PushCollector();
    await collectPushBatch(session, c);

    if (c.changes.length === 0) {
        throw new Error("push collector produced empty batch.");
    }

    const response = await getClient().push(
        create(PushRequestSchema, {
            sessionId: session.sessionId,
            batchSeq: session.batchSeq,
            changes: c.changes,
            finishPush: false,
        }),
        { timeoutMs: timeoutMs },
    );

    if (response.batchSeq !== session.batchSeq) {
        throw new Error(`push batchSeq mismatch: expected ${session.batchSeq}, got ${response.batchSeq}`);
    }

    const changes = c.changes;
    c.response(response);
    Logger.info(`push batch ${session.batchSeq} acknowledged with ${changes.length} changes.`);
    session.batchSeq += 1;
    return changes.length;
}

function collectPushBatch(
    session: SyncSession,
    collector: PushCollector,
): void {
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
