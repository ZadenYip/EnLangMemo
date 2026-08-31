
export interface PullResult {
    kind: "success";
    changes: number;
    lastBatch: boolean;
}

export interface ApplyResult {
    kind: "success";
    changes: number;
    lastBatch: boolean;
}

