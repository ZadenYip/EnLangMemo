export interface PushBatchResult {
    kind: "success";
    changes: number;
    lastBatch: boolean;
}