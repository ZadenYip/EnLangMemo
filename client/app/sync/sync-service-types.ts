export type SyncRpcErrorCode =
    | "canceled"
    | "unknown"
    | "invalid_argument"
    | "deadline_exceeded"
    | "permission_denied"
    | "resource_exhausted"
    | "unavailable"
    | "unauthenticated"
    | "internal";


export type HandshakeViewResult =
    | { kind: "status"; hasLocalChanges: boolean }
    | { kind: "rpc_error"; code: SyncRpcErrorCode; message: string };