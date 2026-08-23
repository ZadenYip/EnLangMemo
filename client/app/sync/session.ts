import { HandshakeResponse, HandshakeStatus } from "@enlangmemo/sync-api";

/** 当前同步会话在主进程内存中的握手快照。 */
export interface SyncSession {
    status: HandshakeStatus;
    clientColUsn: bigint;
    sessionId?: string;
    serverSyncCursorUsnAtHandshake: bigint;
    serverLastSyncTimeAtHandshake: bigint;
    serverCollectionId?: Buffer;
}

/** 当前主进程内存中的同步会话快照。 */
let curSyncSession: SyncSession | null = null;

/** 保存当前同步会话快照，供后续 Pull、Push、FinishSync 阶段读取。 */
export function createSyncSession(clientColUsn: bigint, response: HandshakeResponse): SyncSession {
    curSyncSession = {
        status: response.status,
        clientColUsn,
        sessionId: response.sessionId,
        serverSyncCursorUsnAtHandshake: response.serverSyncCursorUsn,
        serverLastSyncTimeAtHandshake: response.serverLastSyncTime,
        serverCollectionId: response.collectionId ? Buffer.from(response.collectionId) : undefined,
    };
    return curSyncSession;
}

export function getSyncSession(): SyncSession | null {
    return curSyncSession;
}

export function clearSyncSession(): void {
    curSyncSession = null;
}
