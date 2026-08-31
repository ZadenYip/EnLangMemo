import type { SyncError } from "../error/error-types.js";

export type FinishResult = { kind: "success" } | SyncError;