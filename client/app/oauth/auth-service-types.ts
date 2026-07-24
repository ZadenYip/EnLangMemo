import type { FetchError, FetchJsonError } from "@main/network/errors";

export interface AuthUser {
    /** Current user ID from the EnLangMemo OAuth server. */
    userId: string;
    /** Login ID used by the current user. */
    loginId: string;
    /** Display nickname of the current user. */
    nickname: string;
}

export type AuthFailureReason =
    | FetchError
    | FetchJsonError
    | "callback_timeout"
    | "server_error"
    | "exchange_token_unauthorized"
    | "unexpected_error";

export interface CurUserResponse {
    /** Whether the current-user query completed without transport or server errors. */
    success: boolean;
    /** Current user information when logged in, otherwise null. */
    user: AuthUser | null;
    /** Short failure reason for logs or renderer-side branching. */
    error?: AuthFailureReason;
}
