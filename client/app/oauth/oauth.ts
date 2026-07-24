import * as crypto from "crypto";
import { shell } from "electron";
import Logger from "electron-log/main";
import { TokenErrorResponse, TokenResponse } from "./token";
import { OAUTH_API_BASE_URL } from "./oauth-config";
import type { OAuthFailureReason } from "./auth-service.types";
import { isDev } from "@main/main";

export const OAUTH_CALLBACK_PATH = "enlangmemo://oauth/callback";

/** Maximum time to wait for the OAuth token endpoint. */
const TOKEN_EXCHANGE_TIMEOUT_MS = 10_000;

/** Internal OAuth flow error converted to CurUserResponse by the IPC service. */
export class OAuthFlowError extends Error {
    /** Structured OAuth failure reason for IPC response mapping. */
    readonly reason: OAuthFailureReason;
    /** HTTP status returned by the OAuth server, when available. */
    readonly status?: number;

    /**
     * Create an internal OAuth flow error.
     * @param reason - Structured failure reason for IPC response mapping.
     * @param message - Log-friendly failure message.
     * @param status - Optional HTTP status returned by OAuth server.
     * @param cause - Original lower-level failure.
     */
    constructor(reason: OAuthFailureReason, message: string, status?: number, cause?: unknown) {
        super(message, { cause });
        this.name = "OAuthFlowError";
        this.reason = reason;
        this.status = status;
    }
}

let pkceFlow: PKCEFlow | null = null;

export async function startPKCEFlow(): Promise<TokenResponse> {
    pkceFlow = new PKCEFlow();
    try {
        return await pkceFlow.start();
    } finally {
        pkceFlow = null;
    }
}

export function handleAuthorizeCallback(url: string): void {
    if (!pkceFlow) {
        Logger.error("PKCE flow is not initialized. Cannot handle OAuth callback.");
        return;
    }
    pkceFlow.authorizeCallback(url);
}

interface PKCESession {
    /**
     * The response type for the OAuth flow, typically "code" for the authorization code flow.
     */
    responseType: string;
    /**
     * The OAuth client ID for the application.
     */
    readonly clientID: string;
    redirectURI: string;
    /**
     * The state parameter for the OAuth flow.
     */
    state: string;
    codeVerifier: string;
    authorizationCode: string;
}

class PKCEFlow {
    private callbackTimeout: NodeJS.Timeout | null = null;
    readonly oauthPromise = Promise.withResolvers<TokenResponse>();
    

    private session: PKCESession = {
        responseType: "",
        codeVerifier: "",
        clientID: "",
        state: "",
        redirectURI: "",
        authorizationCode: "",
    };

    public async start(): Promise<TokenResponse> {
        this.session = {
            responseType: "code",
            // TODO 填写正式的 OAuth 客户端 ID
            clientID: isDev() ? "00000000-0000-0000-0000-000000000010" : "",
            redirectURI: OAUTH_CALLBACK_PATH,
            state: genRandomBytes(32).toString("base64url"),
            codeVerifier: genRandomBytes(32).toString("base64url"),
            authorizationCode: "",
        };

        this.callbackTimeout = setTimeout(() => {
            this.oauthPromise.reject(
                new OAuthFlowError(
                    "oauth_callback_timeout",
                    "OAuth callback not received within timeout period（60 seconds）",
                ),
            );
        }, 30_000);
        await this.sendAuthorizeRequest();

        return this.oauthPromise.promise;
    }

    /**
     * @returns The base64url-encoded SHA256 hash of the code verifier
     */
    public codeChallengeBase64Url(): string {
        const s256Code = crypto
            .createHash("sha256")
            .update(this.session.codeVerifier)
            .digest("base64url");
        return s256Code;
    }

    /**
     * This would be called when the OAuth server redirects back to the application
     * @param url - The OAuth callback URL containing the authorization code and state.
     */
    public authorizeCallback(url: string): void {
        if (this.callbackTimeout) {
            clearTimeout(this.callbackTimeout);
        }
        
        const code = this.extractOACode(url);
        if (!code) {
            this.oauthPromise.reject(
                new OAuthFlowError(
                    "oauth_callback_invalid",
                    "Failed to extract authorization code from OAuth callback URL",
                ),
            );
            return;
        }
        this.session.authorizationCode = code;
        void this.exchangeToken();
    }

    private async exchangeToken(): Promise<void> {
        const url = new URL(OAUTH_API_BASE_URL + "/token");

        const params = new URLSearchParams();
        params.set("grant_type", "authorization_code");
        params.set("code", this.session.authorizationCode);
        params.set("redirect_uri", this.session.redirectURI);
        params.set("client_id", this.session.clientID);
        params.set("code_verifier", this.session.codeVerifier);

        let response: Response;

        try {
            response = await fetch(url, {
                method: "POST",
                body: params,
                signal: AbortSignal.timeout(TOKEN_EXCHANGE_TIMEOUT_MS),
            });
        } catch (error) {
            const isTimeout = isTimeoutError(error);
            let err: OAuthFlowError;
            if (isTimeout) {
                Logger.error("Token exchange request timed out", error);
                err = new OAuthFlowError(
                    "oauth_token_timeout",
                    "Failed to exchange token: request timed out",
                    undefined,
                    error,
                );
            } else {
                if (error instanceof Error) {
                    Logger.error("Token exchange request failed", (error as Error).message);
                }
                err = new OAuthFlowError(
                    "oauth_token_unknown_error",
                    "failed to exchange token: unexpected error",
                    undefined,
                    error,
                );
            }
            this.oauthPromise.reject(err);
            return;
        }

        let rawData: unknown;
        try {
            rawData = await response.json();
        } catch (error) {
            this.oauthPromise.reject(
                new OAuthFlowError(
                    "oauth_token_request_failed",
                    "Failed to exchange token: invalid token response",
                    response.status,
                    error,
                ),
            );
            return;
        }
        switch (response.status) {
            case 200:
                this.oauthPromise.resolve(rawData as TokenResponse);
                break;
            case 400:
                if (rawData as TokenErrorResponse) {
                    const errorResponse = rawData as TokenErrorResponse;
                    this.oauthPromise.reject(new OAuthFlowError(
                        "oauth_token_invalid_request",
                        errorResponse.error || "Failed to exchange token: Invalid request",
                        response.status,
                    ));
                } else {
                    this.oauthPromise.reject(new OAuthFlowError(
                        "oauth_token_invalid_request",
                        "Failed to exchange token: Invalid request",
                        response.status,
                    ));
                }
                break;
            case 500:
                this.oauthPromise.reject(new OAuthFlowError(
                    "oauth_token_server_error",
                    "Failed to exchange token: OAuth server internal error",
                    response.status,
                ));
                break;
            default:
                this.oauthPromise.reject(new OAuthFlowError(
                    "oauth_token_unknown_error",
                    `Failed to exchange token: Unknown error, response: ${JSON.stringify(rawData)}`,
                    response.status,
                ));
        }
    }

    private async sendAuthorizeRequest(): Promise<void> {
        const url = new URL(OAUTH_API_BASE_URL + "/authorize");
        url.searchParams.set("response_type", this.session.responseType);
        url.searchParams.set("client_id", this.session.clientID);
        url.searchParams.set("redirect_uri", this.session.redirectURI);
        url.searchParams.set("state", this.session.state);
        url.searchParams.set("code_challenge", this.codeChallengeBase64Url());
        url.searchParams.set("code_challenge_method", "S256");

        await shell.openExternal(url.toString());
    }

    /**
     * Extracts the authorization code from the OAuth callback URL.
     * @param urlStr - The URL string that contains the authorization code and state parameters.
     * @returns The authorization code if the state matches; otherwise, an empty string (include error cases).
     */
    private extractOACode(urlStr: string): string {
        const url = new URL(urlStr);
        const code = url.searchParams.get("code");
        const urlState = url.searchParams.get("state");

        if (urlState !== this.session.state) {
            Logger.error("OAuth state mismatch: expected state");
            return "";
        }

        if (!code) {
            Logger.error("OAuth callback received without authorization code");
            return "";
        }

        return code;
    }
}

function genRandomBytes(size: number): Buffer {
    return crypto.randomBytes(size);
}

/**
 * Check whether fetch failed because the token request timed out.
 * @param error - Unknown error thrown by fetch.
 * @returns True when the error represents a timeout or abort.
 */
function isTimeoutError(error: unknown): boolean {
    return error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError");
}
