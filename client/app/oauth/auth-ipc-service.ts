import Logger from "electron-log/main";
import { IAuthService, } from "./auth-service.interface";
import { loadToken, saveToken, clearToken } from "./token-store";
import { OAuthFlowError, startPKCEFlow } from "./oauth";
import { APP_API_BASE_URL } from "./oauth-config";
import type { AuthFailureReason, AuthUser, CurUserResponse } from "./auth-service.types";

interface MeResponse {
    user_id: string;
    login_id: string;
    nickname: string;
}

const ME_ENDPOINT = `${APP_API_BASE_URL}/v1/apps/enlangmemo/me`;

/** IPC-facing auth service that keeps access tokens in the main process. */
export class AuthIpcService implements IAuthService {

    /**
     * Start the OAuth login flow and will save the access token if successful.
     * @returns The current-user query response after login.
     */
    public async startLogin(): Promise<CurUserResponse> {
        try {
            const token = await startPKCEFlow();

            saveToken(token);
            return this.getCurUser();
        } catch (error) {
            // catch startPKCEFlow() errors not getCurUser() errors
            Logger.error("Failed to start OAuth login", error);
            return failedCurUserResponse(...mapLoginFailure(error));
        }
    }

    /** Query the current user with the stored access token. */
    public async getCurUser(): Promise<CurUserResponse> {
        const token = loadToken();

        const tokenNotFound = !token;

        if (tokenNotFound) {
            return successfulCurUserResponse(null);
        }

        const tokenExpired = token.expiresAt <= Date.now();
        if (tokenExpired) {
            clearToken();
            return successfulCurUserResponse(null);
        }

        try {
            const response = await fetch(ME_ENDPOINT, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token.accessToken}`,
                },
                signal: AbortSignal.timeout(10_000),
            });

            if (response.status === 400) {
                Logger.error(`invalid request to current-user endpoint, status: ${response.status}`);
                return failedCurUserResponse("cur_user_invalid_request", response.status);
            }

            if (response.status === 401) {
                Logger.error(`Current-user query failed inside auth server, status: ${response.status}`);
                clearToken();
                return failedCurUserResponse("cur_user_unauthorized", response.status);
            }

            if (response.status === 500) {
                Logger.error("Current-user query failed inside auth server, status: 500");
                return failedCurUserResponse("cur_user_server_error", response.status);
            }

            if (!response.ok) {
                Logger.error(`Failed to fetch current user, status: ${response.status}`);
                return failedCurUserResponse("cur_user_unknown_error", response.status);
            }

            const curUserResponse = await response.json() as MeResponse;

            return successfulCurUserResponse({
                userId: curUserResponse.user_id,
                loginId: curUserResponse.login_id,
                nickname: curUserResponse.nickname,
            });
        } catch (error) {
            const failureReason = isTimeoutError(error) ? "cur_user_timeout" : "cur_user_request_failed";
            Logger.error(`Failed to query current user, reason: ${failureReason}`, error);
            return failedCurUserResponse(failureReason);
        }
    }

}

/**
 * Create a successful current-user query response.
 * @param user - Current user when logged in, otherwise null.
 * @returns Current-user response DTO for IPC callers.
 */
function successfulCurUserResponse(user: AuthUser | null): CurUserResponse {
    return {
        success: true,
        user,
    };
}

/**
 * Create a failed current-user query response.
 * @param error - Short failure reason for renderer-side branching.
 * @param status - Optional HTTP status returned by the auth server.
 * @returns Current-user response DTO for IPC callers.
 */
function failedCurUserResponse(error: AuthFailureReason, status?: number): CurUserResponse {
    return {
        success: false,
        user: null,
        status,
        error,
    };
}

/**
 * Map OAuth login failures into the current-user response failure tuple.
 * @param error - Unknown error caught from the OAuth login flow.
 * @returns Failure reason and optional HTTP status for CurUserResponse.
 */
function mapLoginFailure(error: unknown): [AuthFailureReason, number?] {
    if (!(error instanceof OAuthFlowError)) {
        return ["oauth_login_failed"];
    }

    return [error.reason, error.status];
}

/**
 * Check whether a fetch or body parsing failure was caused by timeout.
 * @param error - Unknown error caught from fetch or response body parsing.
 * @returns True when the error represents an aborted timeout.
 */
function isTimeoutError(error: unknown): boolean {
    return error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError");
}
