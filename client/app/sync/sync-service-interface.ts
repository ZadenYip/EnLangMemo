import { ProxyPropertyType } from "electron-ipc-cat/common";
import { HandshakeViewResult } from "./handshake/handshake-types.js";
import type { Observable } from "rxjs";
import type { PushBatchResult } from "./push/push-types.js";
import type { FinishResult } from "./finish/finish-types.js";

export interface ISyncService {
    /**
     * handshake with the server and return a result indicating the status of the handshake or an RPC error.
     */
    handshake(): Promise<HandshakeViewResult>;
    /**
     * Push local changes and emit one result for each acknowledged batch.
     */
    push$(): Observable<PushBatchResult>;
    /**
     * finish the sync session
     */
    finish(): Promise<FinishResult>;
    /**
     * update the collection ID if it mismatches the one on the server.
     * @returns A promise that resolves when the operation is complete.
     */
    correctColId(): Promise<boolean>;
}

export const SyncServiceIPCDescriptor = {
    channel: "syncService",
    properties: {
        handshake: ProxyPropertyType.Function,
        push$: ProxyPropertyType.Function$,
        finish: ProxyPropertyType.Function,
        correctColId: ProxyPropertyType.Function,
    },
};
