import { Code } from "@connectrpc/connect";

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

/**
 * map a ConnectRPC Code to a SyncRpcErrorCode, so that can be transported with ipc
 * @param code 
 * @returns SyncRpcErrorCode mapped from the given Code.
 */
export function mapRpcErrorCode(code: Code): SyncRpcErrorCode {
    switch (code) {
        case Code.Canceled:
            return "canceled";
        case Code.InvalidArgument:
            return "invalid_argument";
        case Code.DeadlineExceeded:
            return "deadline_exceeded";
        case Code.PermissionDenied:
            return "permission_denied";
        case Code.ResourceExhausted:
            return "resource_exhausted";
        case Code.Unavailable:
            return "unavailable";
        case Code.Unauthenticated:
            return "unauthenticated";
        case Code.Internal:
            return "internal";
        default:
            return "unknown";
    }
}