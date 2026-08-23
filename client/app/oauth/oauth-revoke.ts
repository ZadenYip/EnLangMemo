import { mapFetchError } from "@main/network/errors.js";
import { RevokeResponse } from "./auth-service-types.js";
import { CLIENT_ID, OAUTH_API_BASE_URL } from "./oauth-config.js";
import { clearToken, loadToken } from "./token-store.js";
import Logger from "electron-log/main.js";

/**
 * send a request to server to revoke token, 
 * and clear the token in local storage if successful
 * @returns Promise<RevokeResponse> - the result of the revoke operation
 */
export async function revokeToken(): Promise<RevokeResponse> {
    const token = loadToken();
    if (!token) {
        return { success: false, error: "unexpected_error" };
    }

    const response = await revokeRequest(token.accessToken);
    if (response.success) {
        clearToken();
        Logger.info("token revoked successfully, local token cleared.");
    }

    return response;
}

async function revokeRequest(token: string): Promise<RevokeResponse> {
    try {
        const response = await fetch(OAUTH_API_BASE_URL + "/revoke", {
            method: "POST",
            signal: AbortSignal.timeout(5_000),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params(token),
        });
        if (response.status === 200) { return { success: true }; }
        if (response.status >= 500) { return { success: false, error: "server_error" }; }
        return { success: false, error: "unexpected_error" };
    } catch (error) {
        Logger.error("failed to revoke token with request", error);
        const fetchError = mapFetchError(error);
        return { success: false, error: fetchError };
    }
}
    
function params(token: string): URLSearchParams {
    const params = new URLSearchParams();
    params.append("token", token);
    params.append("client_id", CLIENT_ID);
    return params;
}