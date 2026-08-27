import { FinishSyncRequestSchema, FinishSyncResponse, HandshakeResponse, HandshakeStatus } from "@enlangmemo/sync-api";
import { PushQueue } from "./push/push-queue.js";
import { create } from "@bufbuild/protobuf";
import { getClient } from "./index.js";
import Logger from "electron-log/main.js";

export type SyncSessionStatus = "HANDSHAKING" | "NO_REMOTE_CHANGES" | "PULLING" | "PUSHING" | "FINISHING" | "FINISHED" | "FAILED";

// 10 seconds
export const rpcTimeoutMs = 10_000;
export interface SyncSession {
    status: SyncSessionStatus;
    clientColUsn: bigint;
    sessionId?: string;
    batchSeq: number;
    serverSyncCursorUsnAtHandshake: bigint;
    serverLastSyncTimeAtHandshake: bigint;
    serverCollectionId?: Buffer;
    queue?: PushQueue;
}

let curSyncSession: SyncSession | null = null;

/**
 * Create a new sync session.
 * @param clientColUsn - The current local collection USN.
 * @param response - The handshake response from the server.
 * @returns The newly created sync session.
 */
export function createSyncSession(
    clientColUsn: bigint,
    response: HandshakeResponse,
): SyncSession {
    curSyncSession = {
        status: initialSyncStatus(response.status),
        clientColUsn,
        sessionId: response.sessionId,
        batchSeq: 1,
        serverSyncCursorUsnAtHandshake: response.serverSyncCursorUsn,
        serverLastSyncTimeAtHandshake: response.serverLastSyncTime,
        serverCollectionId: response.collectionId ? Buffer.from(response.collectionId) : undefined,
        queue: undefined,
    };
    return curSyncSession;
}

/** Convert the server handshake status into the client's local sync session state. */
function initialSyncStatus(hskStatus: HandshakeStatus): SyncSessionStatus {
    switch (hskStatus) {
        case HandshakeStatus.NEED_PULL:
            return "PULLING";
        case HandshakeStatus.NO_REMOTE_CHANGES:
            // only create a sync session for pushing if there are local changes to push
            // if there are no local changes, it wouldn't reach here to create session.
            return "PUSHING";
        default:
            return "FAILED";
    }
}

export function resetPushQueue(): void {
    if (curSyncSession) {
        curSyncSession.queue = PushQueue.NewSyncQueue();
    } else {
        throw new Error("No sync session found. Cannot start push phase.");
    }
}

export function getSyncSession(): SyncSession | null {
    return curSyncSession;
}

/**
 * 
 * @returns The active sync session, or throws an error if no session is active.
 */
export function getSyncSessionOrThrow(): SyncSession {
    if (!curSyncSession) {
        throw new Error("no sync session found.");
    }
    return curSyncSession;
}

export function clearSyncSession(): void {
    curSyncSession = null;
}

export async function sendFinish(): Promise<FinishSyncResponse> {
    if (!curSyncSession) {
        throw new Error("no sync session found.");
    }
    const req = create(FinishSyncRequestSchema, {
        sessionId: curSyncSession.sessionId!,
    })

    if (curSyncSession.status !== "FINISHING") {
        Logger.error(`sync session is not in FINISHING state when trying to finish. Current status: ${curSyncSession.status}`);
        throw new Error("sync session is not in FINISHING state when trying to finish.");
    }

    const result = await getClient().finishSync(req, { timeoutMs: rpcTimeoutMs });
    curSyncSession.status = "FINISHED";
    return result;
}
