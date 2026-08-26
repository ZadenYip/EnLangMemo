import { getRepDb } from "@main/db/db.js";
import { sendFinish } from "../session.js";
import { FinishResult } from "./finish-types.js";
import { collectionTable } from "@main/db/schema/repetition/rep.js";
import { toInt } from "../helper/type.js";
import { ConnectError } from "@connectrpc/connect";
import { mapRpcErrorCode } from "../error/rpc-error-code.js";
import { FinishSyncResponse } from "@enlangmemo/sync-api";
import Logger from "electron-log";


export async function finish(): Promise<FinishResult> {
    let resp: FinishSyncResponse;
    try {
        resp = await sendFinish();
    } catch (error) {
        if (error instanceof ConnectError) {
            const code = mapRpcErrorCode(error.code);
            return {
                kind: "rpc_error",
                code: code,
                message: error.rawMessage,
            }
        }
        throw error;
    }
    updateCliFinishSyncTime(toInt(resp.serverFinishedAt))

    return {
        "kind": "success",
    }
}

function updateCliFinishSyncTime(time: number): void {
    Logger.info("update client last sync time", time);
    getRepDb().update(collectionTable).set({
        lastSyncTime: time,
    }).run();
}