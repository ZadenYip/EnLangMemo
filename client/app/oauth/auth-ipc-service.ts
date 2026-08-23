import Logger from "electron-log/main";
import { IAuthService, } from "./auth-service-interface";
import { loadToken, saveToken, clearToken } from "./token-store";
import { OAuthError, startPKCEFlow } from "./oauth-pkce";
import {  } from "./oauth-config";
import type { AuthFailureReason, AuthUser, CurUserResponse, RevokeResponse } from "./auth-service-types";
import { mapFetchError, mapFetchJsonError } from "@main/network/errors";
import { revokeToken } from "./oauth-revoke";
import { APP_API_BASE_URL } from "@main/env/env";

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
            if (error instanceof OAuthError) {
                return failedCurUserResponse((error as OAuthError).reason);
            } 
            return failedCurUserResponse("unexpected_error");
        }
    }

    /**
     * Clear the stored access token and revoke it on the server.
     * @returns The revoke response after logout.
     */
    public async logout(): Promise<RevokeResponse> {
        return await revokeToken();
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

        let response: Response;
        try {
            response = await fetch(ME_ENDPOINT, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token.accessToken}`,
                },
                signal: AbortSignal.timeout(10_000),
            });
        } catch (error) {
            Logger.error("failed to fetch current user with request", error);
            return failedCurUserResponse(mapFetchError(error));
        }
        if (response.status === 401) {
            Logger.error(
                `Current-user query failed inside auth server, status: ${response.status}`,
            );
            clearToken();
            return failedCurUserResponse("exchange_token_unauthorized");
        }

        if (response.status === 500) {
            Logger.error(
                "Current-user query failed inside auth server, status: 500",
            );
            return failedCurUserResponse("server_error");
        }

        if (!response.ok) {
            Logger.error(
                `Failed to fetch current user, status: ${response.status}`,
            );
            return failedCurUserResponse("unexpected_error");
        }

        try {
            const curUserResponse = (await response.json()) as MeResponse;
            return successfulCurUserResponse({
                userId: curUserResponse.user_id,
                loginId: curUserResponse.login_id,
                nickname: curUserResponse.nickname,
            });
        } catch (error) {
            Logger.error("failed to parse current user response", error);
            return failedCurUserResponse(mapFetchJsonError(error));
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
 * @returns Current-user response DTO for IPC callers.
 */
function failedCurUserResponse(error: AuthFailureReason): CurUserResponse {
    return {
        success: false,
        user: null,
        error,
    };
}
