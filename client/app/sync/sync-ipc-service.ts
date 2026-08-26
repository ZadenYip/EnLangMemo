import type { ISyncService } from "./sync-service-interface.js";
import { handshake, updateColIdIfMismatch } from "./handshake/handshake.js";
import { HandshakeViewResult } from "./sync-service-types.js";

export class SyncIpcService implements ISyncService {
    /**
     * handshake with the server and create build-in sync session if the handshake is successful.
     * @returns HandshakeViewResult indicating the status of the handshake or an RPC error.
     */
    public async handshake(): Promise<HandshakeViewResult> {
        return await handshake();
    }

    /**
     * update the collection ID if it mismatches the one on the server.
     * @returns A promise that resolves when the operation is complete.
     */
    public async correctColId(): Promise<boolean> {
        return updateColIdIfMismatch();
    }
}
