import type { ISyncService } from "./sync-service-interface.js";
import { handshake, updateColIdIfMismatch } from "./handshake/handshake.js";
import { HandshakeViewResult } from "./handshake/handshake-types.js";
import { Observable } from "rxjs";
import { PushBatchResult } from "./push/push-types.js";
import { push$ } from "./push/push.js";
import { finish } from "./finish/finish.js";
import type { FinishResult } from "./finish/finish-types.js";

export class SyncIpcService implements ISyncService {
    /**
     * handshake with the server and create build-in sync session if the handshake is successful.
     * @returns HandshakeViewResult indicating the status of the handshake or an RPC error.
     */
    public async handshake(): Promise<HandshakeViewResult> {
        return await handshake();
    }

    public push$(): Observable<PushBatchResult> {
        return push$();
    }

    public async finish(): Promise<FinishResult> {
        return await finish();
    }

    /**
     * update the collection ID if it mismatches the one on the server.
     * @returns A promise that resolves when the operation is complete.
     */
    public async correctColId(): Promise<boolean> {
        return updateColIdIfMismatch();
    }
}
