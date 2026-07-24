
export type FetchError =
    | "timeout"
    | "network_error"
    | "fetch_aborted"

export type FetchJsonError =
    | "timeout"
    | "network_error"
    | "fetch_aborted"
    | "invalid_json"

export function mapFetchError(error: unknown): FetchError {
    if (error instanceof Error) {
        if (error.name === "TimeoutError") {
            return "timeout";
        }
        if (error.name === "AbortError") {
            return "fetch_aborted";
        }
    }
    return "network_error";
}

export function mapFetchJsonError(error: unknown): FetchJsonError {
    if (error instanceof SyntaxError) {
        return "invalid_json";
    }
    return mapFetchError(error);
}