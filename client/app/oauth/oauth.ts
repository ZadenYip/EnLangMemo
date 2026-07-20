import * as crypto from "crypto";
import { shell } from "electron";
import Logger from "electron-log/main";
import { TokenErrorResponse, TokenResponse } from "./token";
import { isDev } from "@main/main";

export const OAUTH_CALLBACK_PATH = "enlangmemo://oauth/callback";
// TODO production environment should use the real OAuth server URL
const OAUTH_BASE_URL = isDev() ? "http://127.0.0.1:8080/v1/oauth" : "";

let pkceFlow: PKCEFlow | null = null;

export async function startPKCEFlow(): Promise<TokenResponse> {
    pkceFlow = new PKCEFlow();
    return pkceFlow.start();
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
            // TODO 填写 OAuth 客户端 ID
            clientID: "test-client-id",
            redirectURI: OAUTH_CALLBACK_PATH,
            state: genRandomBytes(32).toString("base64url"),
            codeVerifier: genRandomBytes(32).toString("base64url"),
            authorizationCode: "",
        };

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

    public authorizeCallback(url: string): void {
        const code = this.extractOACode(url);
        if (!code) {
            this.oauthPromise.reject(
                new Error(
                    "Failed to extract authorization code from OAuth callback URL",
                ),
            );
        }
        this.session.authorizationCode = code;
        void this.exchangeToken().catch((err) => {
            this.oauthPromise.reject(
                new Error(`Failed to exchange token: ${err.message}`),
            );
        });
    }

    private async exchangeToken(): Promise<void> {
        const url = new URL(OAUTH_BASE_URL + "/token");

        const params = new URLSearchParams();
        params.set("grant_type", "authorization_code");
        params.set("code", this.session.authorizationCode);
        params.set("redirect_uri", this.session.redirectURI);
        params.set("client_id", this.session.clientID);
        params.set("code_verifier", this.session.codeVerifier);

        const response = await fetch(url, {
            method: "POST",
            body: params,
        });

        const rawData = await response.json();
        switch (response.status) {
            case 200:
                this.oauthPromise.resolve(rawData as TokenResponse);
                break;
            case 400:
                if (rawData as TokenErrorResponse) {
                    const errorResponse = rawData as TokenErrorResponse;
                    this.oauthPromise.reject(new Error(errorResponse.error || "Failed to exchange token: Invalid request"));
                } else {
                    this.oauthPromise.reject(new Error("Failed to exchange token: Invalid request"));
                }
                break;
            default:
                this.oauthPromise.reject(new Error(`Failed to exchange token: Unknown error, response: ${JSON.stringify(rawData)}`));
        }
    }

    private async sendAuthorizeRequest(): Promise<void> {
        const url = new URL(OAUTH_BASE_URL + "/authorize");
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
