import { ProxyPropertyType } from "electron-ipc-cat/common";
import type { HandshakeViewResult } from "./handshake/handshake";

export interface ISyncService {
    /**
     * handshake with the server and return a result indicating the status of the handshake or an RPC error.
     */
    handshake(): Promise<HandshakeViewResult>;
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
        correctColId: ProxyPropertyType.Function,
    },
};
