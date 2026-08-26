import { HandshakeStatus } from "@enlangmemo/sync-api/gen/enlangmemo/sync/v1/handshake_pb";
import type { HandshakeViewResult } from "../../../../../app/sync/handshake/handshake-types.js";
import { confirmAndCorrectCollectionId } from "./collection-id.js";
import type { FlowDeps } from "./deps.js";
import { notifyRpcError } from "./error.js";
import { runPushFlow } from "./push.js";
import Logger from "electron-log/renderer.js";

/**
 * handleHskResult（handleHandshakeResult）
 * Routes a handshake result into the next sync phase
 * @param result 
 * @param deps 
 * @returns 
 */
export async function moveSyncPhase(result: HandshakeViewResult, deps: FlowDeps): Promise<void> {
    if (result.kind === "rpc_error") {
        notifyRpcError(deps, result.code);
        return;
    }

    switch (result.status) {
        case HandshakeStatus.NO_REMOTE_CHANGES:
            if (!result.hasLocalChanges) {
                deps.notify.open(deps.translate.instant("SYNC.MESSAGES.NO_NEW_DATA"));
                return;
            }
            await runPushFlow(deps);
            return;
        case HandshakeStatus.NEED_PULL:
            deps.notify.open(deps.translate.instant("SYNC.MESSAGES.SYNCING"));
            Logger.info("next sync phase placeholder triggered.");
            return;
        case HandshakeStatus.UPLOAD_ALL:
            Logger.error("upload-all sync path is not implemented yet.");
            deps.notify.open(deps.translate.instant("SYNC.MESSAGES.UNEXPECTED_ERROR"));
            return;
        case HandshakeStatus.LOCKED_BY_OTHER_CLIENT:
            deps.notify.open(deps.translate.instant("SYNC.MESSAGES.LOCKED_BY_OTHER_CLIENT"));
            return;
        case HandshakeStatus.CLIENT_TOO_OLD:
            deps.notify.open(deps.translate.instant("SYNC.MESSAGES.CLIENT_TOO_OLD"));
            return;
        case HandshakeStatus.SERVER_TOO_OLD:
            deps.notify.open(deps.translate.instant("SYNC.MESSAGES.SERVER_TOO_OLD"));
            return;
        case HandshakeStatus.TIME_SKEW_TOO_LARGE:
            deps.notify.open(deps.translate.instant("SYNC.MESSAGES.TIME_SKEW_TOO_LARGE"));
            return;
        case HandshakeStatus.CLIENT_DATA_TOO_OLD:
            deps.notify.open(deps.translate.instant("SYNC.MESSAGES.CLIENT_DATA_TOO_OLD"));
            return;
        case HandshakeStatus.COLLECTION_ID_MISMATCH:
            await confirmAndCorrectCollectionId(deps);
            return;
        default:
            Logger.error("Unknown handshake status", result.status);
            deps.notify.open(deps.translate.instant("SYNC.MESSAGES.UNEXPECTED_ERROR"));
    }
}
