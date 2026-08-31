
export type SyncRpcErrorCode = "canceled" |
    "unknown" |
    "invalid_argument" |
    "deadline_exceeded" |
    "permission_denied" |
    "resource_exhausted" |
    "unavailable" |
    "unauthenticated" |
    "internal";

export type SyncError = SyncRpcError | SyncUnknownError;

export interface SyncRpcError {
    kind: "rpc_error";
    code: SyncRpcErrorCode;
    message: string;
}

export interface SyncUnknownError {
    kind: "unknown_error";
    message: string;
} 