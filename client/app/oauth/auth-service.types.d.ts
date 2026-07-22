export interface AuthUser {
    /** Current user ID from the EnLangMemo OAuth server. */
    userId: string;
    /** Login ID used by the current user. */
    loginId: string;
    /** Display nickname of the current user. */
    nickname: string;
}

export type OAuthFailureReason =
    | "oauth_callback_timeout"
    | "oauth_callback_invalid"
    | "oauth_token_invalid_request"
    | "oauth_token_server_error"
    | "oauth_token_timeout"
    | "oauth_token_request_failed"
    | "oauth_token_unknown_error"
    | "oauth_login_failed";

export type CurUserFailureReason =
    | "cur_user_invalid_request"
    | "cur_user_unauthorized"
    | "cur_user_server_error"
    | "cur_user_timeout"
    | "cur_user_request_failed"
    | "cur_user_unknown_error";

export type AuthFailureReason = OAuthFailureReason | CurUserFailureReason;

export interface CurUserResponse {
    /** Whether the current-user query completed without transport or server errors. */
    success: boolean;
    /** Current user information when logged in, otherwise null. */
    user: AuthUser | null;
    /** HTTP status returned by the auth server when the query failed. */
    status?: number;
    /** Short failure reason for logs or renderer-side branching. */
    error?: AuthFailureReason;
}
