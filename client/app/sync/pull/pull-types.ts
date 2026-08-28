
export type PullResult = {
    kind: "success";
    changes: number;
    lastBatch: boolean;
} | {
    kind: "rpc_error";
    code: string;
    message: string;
}

export interface ApplyResult {
    kind: "success";
    changes: number;
    lastBatch: boolean;
}

