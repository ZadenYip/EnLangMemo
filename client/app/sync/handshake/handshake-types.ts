import { HandshakeStatus } from "@enlangmemo/sync-api";
import { SyncRpcErrorCode } from "../sync-service-types.js";

export type HandshakeViewResult =
    | { kind: "status"; status: HandshakeStatus; hasLocalChanges: boolean }
    | { kind: "rpc_error"; code: SyncRpcErrorCode; message: string };