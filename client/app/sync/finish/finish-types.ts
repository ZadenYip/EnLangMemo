import type { SyncRpcErrorCode } from "../sync-service-types.js";


export type FinishResult = {
    kind: "success";
} | {
    kind: "rpc_error";
    code: SyncRpcErrorCode;
    message: string;
}