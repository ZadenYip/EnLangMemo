

export type FinishResult = {
    kind: "success";
} | {
    kind: "rpc_error";
    code: string;
    message: string;
}