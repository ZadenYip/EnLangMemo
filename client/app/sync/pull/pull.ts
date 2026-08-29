import { create } from "@bufbuild/protobuf";
import {
    ChangeOp,
    EntityType,
    PullRequestSchema,
    PullResponse,
    SyncChange,
} from "@enlangmemo/sync-api";
import { getSyncSessionOrThrow, rpcTimeoutMs } from "../session.js";
import { getClient } from "../index.js";
import { ConnectError } from "@connectrpc/connect";
import { mapRpcErrorCode } from "../error/rpc-error-code.js";
import {
    clearPullStore,
    decodePullResp,
    openPullWriterStream,
    readPullResps,
} from "./proto-msg-store.js";
import { Observable } from "rxjs";
import { ApplyResult, PullResult } from "./pull-types.js";
import Logger from "electron-log/main.js";
import { RepTx } from "@main/db/services/repetition/helper/type.js";
import { toInt } from "../helper/type.js";
import { getRepDb } from "@main/db/db.js";
import { applyCardDelete, applyCardUpsert } from "./apply/card.js";
import { applyCollectionUpsert as applyColUpsert } from "./apply/collection.js";
import { applyDeckDelete, applyDeckUpsert } from "./apply/deck.js";
import { applyNoteTypeDelete, applyNoteTypeUpsert } from "./apply/note-type.js";
import { applyNoteDelete, applyNoteUpsert } from "./apply/note.js";
import { applyPcsNoteDelete, applyPcsNoteUpsert as applyPcsNoteUpsert } from "./apply/processing-note.js";
import { applyReviewLogDelete, applyReviewLogUpsert } from "./apply/review-log.js";
import { updatePullSyncCursor } from "./apply/common.js";

export function pull$(): Observable<PullResult> {
    return new Observable<PullResult>((subscriber) => {
        const run = async () => {
            const session = getSyncSessionOrThrow();
            openPullWriterStream();

            while (true) {
                const req = create(PullRequestSchema, {
                    sessionId: session.sessionId,
                    batchSeq: session.batchSeq,
                });
                let resp: PullResponse;

                try {
                    resp = await getClient().pull(req, {
                        timeoutMs: rpcTimeoutMs,
                    });
                    decodePullResp(resp);
                    session.batchSeq += 1;
                    const result: PullResult = {
                        kind: "success",
                        changes: resp.changes.length,
                        lastBatch: resp.lastBatch,
                    };
                    subscriber.next(result);
                    if (resp.lastBatch) {
                        subscriber.complete();
                        break;
                    }
                } catch (error) {
                    if (error instanceof ConnectError) {
                        clearPullStore();
                        const failureResult: PullResult = {
                            kind: "rpc_error",
                            code: mapRpcErrorCode(error.code),
                            message: error.message,
                        };
                        subscriber.next(failureResult);
                        subscriber.complete();
                        Logger.error(
                            `pull RPC error: ${failureResult.code} - ${failureResult.message}`,
                        );
                        break;
                    } else {
                        subscriber.error(error);
                        Logger.error(`pull unexpected error: ${error}`);
                        throw error;
                    }
                }
            }
        };

        void run();
    });
}

export function applyPull$(): Observable<ApplyResult> {
    return new Observable<ApplyResult>((subscriber) => {
        const run = async () => {
            try {
                const session = getSyncSessionOrThrow();
                const resps: PullResponse[] = [];
                let lastResp: PullResponse | undefined;
                for await (const resp of readPullResps()) {
                    lastResp = resp;
                    resps.push(resp);
                    const result: ApplyResult = {
                        kind: "success",
                        changes: resp.changes.length,
                        lastBatch: resp.lastBatch,
                    };
                    subscriber.next(result);
                    if (resp.lastBatch) {
                        break;
                    }
                }
                if (lastResp === undefined || !lastResp.lastBatch) {
                    throw new Error(
                        "unreachable code: applyPull$ should have completed after processing last batch.",
                    );
                }

                // TODO 根据未来看看有没有性能需要，要每个 resp 作为单独一个事务处理（利用文件系统的基础上完成整个拉取过程完成事务，
                // 比如中途崩了，应用重启后能继续重新应用拉取好的数据）
                getRepDb().transaction((tx) => {
                    for (const resp of resps) {
                        applyPullResponse(tx, resp);
                    }
                    updatePullSyncCursor(tx, toInt(session.serverSyncCursorUsnAtHandshake));
                });
                subscriber.complete();
            } catch (error) {
                subscriber.error();
                Logger.error(`applyPullChanges unexpected error: ${error}`);
                throw error;
            }

        };
        void run();

        // teardown
        return () => clearPullStore();
    });
}

function applyPullResponse(tx: RepTx, resp: PullResponse): void {
    let batchMaxUsn = 0;
    for (const change of resp.changes) {
        batchMaxUsn = Math.max(batchMaxUsn, toInt(change.usn));
        applySyncChange(tx, change);
    }
    // 如果为空那么 batchMaxUsn 就是 0，resp.batchMaxUsn 也应该是 0
    if (batchMaxUsn != toInt(resp.batchMaxUsn)) {
        const msg = `applyPullResponse: batchMaxUsn mismatch: expected ${resp.batchMaxUsn} in ${resp.batchSeq}, got ${batchMaxUsn}`;
        Logger.error(msg);
        throw new Error(msg);
    }
}

function applySyncChange(tx: RepTx, change: SyncChange): void {
    switch (change.op) {
        case ChangeOp.UPSERT:
            applyUpsert(tx, change);
            break;
        case ChangeOp.DELETE:
            applyDelete(tx, change);
            break;
        default:
            {
                const msg = `applySyncChange: unsupported change op: ${change.op}`;
                Logger.error(msg);
                throw new Error(msg);
            }
    }
}

function applyUpsert(tx: RepTx, change: SyncChange): void {
    switch (change.entityType) {
        case EntityType.REVIEW_LOG:
            applyReviewLogUpsert(tx, change);
            return;
        case EntityType.CARD:
            applyCardUpsert(tx, change);
            return;
        case EntityType.NOTE:
            applyNoteUpsert(tx, change);
            return;
        case EntityType.PROCESSING_NOTE:
            applyPcsNoteUpsert(tx, change);
            return;
        case EntityType.NOTE_TYPE:
            applyNoteTypeUpsert(tx, change);
        return;
        case EntityType.DECK:
            applyDeckUpsert(tx, change);
            return;
        case EntityType.COLLECTION:
            applyColUpsert(tx, change);
            return;
        default:
            throw new Error(`applyUpsert: unsupported entity type: ${change.entityType}`);
    }
}

function applyDelete(tx: RepTx, change: SyncChange): void {
    switch (change.entityType) {
        case EntityType.REVIEW_LOG:
            applyReviewLogDelete(tx, change);
            return;
        case EntityType.CARD:
            applyCardDelete(tx, change);
            return;
        case EntityType.NOTE:
            applyNoteDelete(tx, change);
            return;
        case EntityType.PROCESSING_NOTE:
            applyPcsNoteDelete(tx, change);
            return;
        case EntityType.NOTE_TYPE:
            applyNoteTypeDelete(tx, change);
            return;
        case EntityType.DECK:
            applyDeckDelete(tx, change);
            return;
        case EntityType.COLLECTION:
        default:
            throw new Error(`applyDelete: unsupported entity type: ${change.entityType}`);
    }
}
