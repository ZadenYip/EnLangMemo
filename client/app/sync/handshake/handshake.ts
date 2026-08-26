import {
    HandshakeRequestSchema,
    HandshakeStatus,
    type HandshakeRequest,
    type HandshakeResponse,
} from "@enlangmemo/sync-api"
import { ConnectError } from "@connectrpc/connect";
import { eq } from "drizzle-orm";
import Logger from "electron-log/main.js";
import { getRepDb } from "@main/db/db.js";
import {
    cardsTable,
    collectionTable,
    decksTable,
    notesTable,
    noteTypesTable,
    processingNotesTable,
    reviewLogsTable,
    tombstonesTable,
} from "@main/db/schema/repetition/rep.js";
import { getDeviceInfo } from "../helper/device.js"
import { create } from "@bufbuild/protobuf";
import { getClient } from "../index.js";
import { mapRpcErrorCode } from "../error/rpc-error-code.js";
import { clearSyncSession, createSyncSession, getSyncSessionOrThrow } from "../session.js";
import { hexToBuffer } from "@main/db/import/utils.js";
import { HandshakeViewResult } from "./handshake-types.js";
import { getColRow } from "../push/collector/change/collection.js";


export const syncProtocolVersion = 1;

/** 握手 RPC 的单次请求超时时间。 */
const handshakeTimeoutMs = 10_000;


export async function handshake(): Promise<HandshakeViewResult> {
    const info = getDeviceInfo();
    const colRow = getColRow();
    const localChanges = hasLocalChanges();
    const cliSyncCursor = colRow.syncCursorUsn;

    const req: HandshakeRequest = create(HandshakeRequestSchema, {
        deviceId: hexToBuffer(info.deviceId),
        deviceName: info.deviceName,
        collectionId: colRow.id,
        clientSyncCursorUsn: BigInt(cliSyncCursor),
        clientLastSyncTime: BigInt(colRow.lastSyncTime),
        protocolVersion: syncProtocolVersion,
        dbSchemaVersion: colRow.sqliteSchemaVersion,
        clientNow: BigInt(Date.now()),
        hasLocalChanges: localChanges,
    })

    const client = getClient();
    clearSyncSession();
    let response: HandshakeResponse;
    try {
        response = await client.handshake(req, {
            timeoutMs: handshakeTimeoutMs,
        });
    } catch (error) {
        const connectError = ConnectError.from(error);
        Logger.error("Handshake RPC failed:", connectError);
        clearSyncSession();

        return {
            kind: "rpc_error",
            code: mapRpcErrorCode(connectError.code),
            message: connectError.rawMessage,
        };
    }

    switch (response.status) {
        case HandshakeStatus.LOCKED_BY_OTHER_CLIENT:
        case HandshakeStatus.COLLECTION_ID_MISMATCH:
            Logger.info(`handshake failed with status: ${HandshakeStatus[response.status]}.`);
            createSyncSession(BigInt(cliSyncCursor), response);
            break;
        case HandshakeStatus.CLIENT_TOO_OLD:
        case HandshakeStatus.CLIENT_DATA_TOO_OLD:
        case HandshakeStatus.TIME_SKEW_TOO_LARGE:
        case HandshakeStatus.SERVER_TOO_OLD:
            Logger.info(`handshake failed with status: ${HandshakeStatus[response.status]}.`);
            break;
        case HandshakeStatus.UPLOAD_ALL:
            // TODO
            throw new Error("unimplemented: UPLOAD_ALL handshake status.");
        case HandshakeStatus.NEED_PULL:
            Logger.info("handshake indicates that a pull is needed. Creating sync session.");
            createSyncSession(BigInt(cliSyncCursor), response);
            break;
        case HandshakeStatus.NO_REMOTE_CHANGES:
            if (localChanges) {
                createSyncSession(BigInt(cliSyncCursor), response);
                Logger.info("sync session created for push phase.");
            } else {
                Logger.info("handshake indicates no remote changes and no local changes. No sync session created.");
            }
            break;
        case HandshakeStatus.UNSPECIFIED:
        default:
            Logger.error(`handshake failed with UNSPECIFIED status: ${response.status}`);
            throw new Error("handshake failed with UNSPECIFIED status.");
    }

    return {
        kind: "status",
        status: response.status,
        hasLocalChanges: localChanges,
    };
    
}

/**
 * If the server responds with COLLECTION_ID_MISMATCH, update the local collection ID to match the server's.
 * @param clientColId - The current local collection ID.
 * @param response - The handshake response from the server.
 */
export function updateColIdIfMismatch(): boolean {
    const session = getSyncSessionOrThrow();
    if (!session) {
        Logger.error("no sync session found when trying to update collection ID.");
        return false;
    }

    if (!session.serverCollectionId) {
        Logger.error("no server collection ID found in sync session when trying to update collection ID.");
        return false;
    }

    getRepDb().update(collectionTable)
        .set({ id: Buffer.from(session.serverCollectionId) })
        .run();
    Logger.info("updated local collection ID to match server's collection ID due to mismatch.");
    return true;
}

/**
 * @returns true if there are local changes that need to be synchronized with the server, false otherwise.
 */
function hasLocalChanges(): boolean {
    // 需要检查是否有数据要同步到服务器的表
    const syncTables = [
        reviewLogsTable,
        tombstonesTable,
        cardsTable,
        processingNotesTable,
        notesTable,
        noteTypesTable,
        decksTable,
        collectionTable,
    ] as const;

    const repDb = getRepDb();
    for (const table of syncTables) {
        const changedRow = repDb
            .select({ usn: table.usn })
            .from(table)
            .where(eq(table.usn, -1))
            .limit(1)
            .get();

        if (changedRow) {
            return true;
        }
    }

    return false;
}
