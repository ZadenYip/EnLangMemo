import type { SyncRpcErrorCode } from "../sync-service-types.js";

export type PushBatchResult =
    | { kind: "success"; changes: number; lastBatch: boolean }
    | { kind: "rpc_error"; code: SyncRpcErrorCode; message: string }