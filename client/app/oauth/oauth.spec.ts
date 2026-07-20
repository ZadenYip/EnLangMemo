import * as crypto from "crypto";
import { shell } from "electron";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@main/main", () => ({
    // Keeps OAuth tests on the local development OAuth endpoint without loading the Electron app entrypoint.
    isDev: () => true,
}));

vi.mock("electron", () => ({
    shell: {
        // Captures the authorize URL that would normally be opened in the system browser.
        openExternal: vi.fn().mockResolvedValue(undefined),
    },
}));

describe("OAuth PKCE flow", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
        vi.unstubAllGlobals();
    });

    it("exchanges the authorization code for a token after a valid callback", async () => {
        const tokenResponse = {
            access_token: "test-access-token",
            token_type: "bearer",
            expires_in: 3600,
        };
        let tokenRequestBody = "";

        vi.stubGlobal("fetch", vi.fn(async (input: string | URL, init?: RequestInit) => {
            const tokenUrl = new URL(input.toString());
            tokenRequestBody = init?.body?.toString() ?? "";

            expect(tokenUrl.toString()).toBe("http://127.0.0.1:8080/v1/oauth/token");
            expect(init?.method).toBe("POST");

            return new Response(JSON.stringify(tokenResponse), {
                status: 200,
                headers: { "content-type": "application/json" },
            });
        }));

        const { OAUTH_CALLBACK_PATH, handleAuthorizeCallback, startPKCEFlow } = await import("./oauth");

        const oauthPromise = startPKCEFlow();
        await vi.waitFor(() => expect(shell.openExternal).toHaveBeenCalledTimes(1));

        const authorizeUrl = new URL(vi.mocked(shell.openExternal).mock.calls[0][0]);
        const callbackState = authorizeUrl.searchParams.get("state");

        expect(authorizeUrl.toString()).toContain("http://127.0.0.1:8080/v1/oauth/authorize");
        expect(authorizeUrl.searchParams.get("response_type")).toBe("code");
        expect(authorizeUrl.searchParams.get("client_id")).toBe("test-client-id");
        expect(authorizeUrl.searchParams.get("redirect_uri")).toBe(OAUTH_CALLBACK_PATH);
        expect(authorizeUrl.searchParams.get("code_challenge_method")).toBe("S256");
        expect(callbackState).toBeTruthy();

        // Simulate OAuth server redirecting back to the app with the authorization code and state.
        handleAuthorizeCallback(`${OAUTH_CALLBACK_PATH}?code=test-auth-code&state=${callbackState}`);

        await expect(oauthPromise).resolves.toEqual(tokenResponse);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(tokenRequestBody).toBeTruthy();
        const tokenRequestParams = new URLSearchParams(tokenRequestBody);
        expect(tokenRequestParams.get("grant_type")).toBe("authorization_code");
        expect(tokenRequestParams.get("code")).toBe("test-auth-code");
        expect(tokenRequestParams.get("redirect_uri")).toBe(OAUTH_CALLBACK_PATH);
        expect(tokenRequestParams.get("client_id")).toBe("test-client-id");

        const codeVerifier = tokenRequestParams.get("code_verifier");
        const expectedChallenge = crypto
            .createHash("sha256")
            .update(codeVerifier ?? "")
            .digest("base64url");
        expect(codeVerifier).toBeTruthy();
        expect(authorizeUrl.searchParams.get("code_challenge")).toBe(expectedChallenge);
    });

    it("rejects the flow and does not exchange tokens when callback state is invalid", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));

        const { OAUTH_CALLBACK_PATH, handleAuthorizeCallback, startPKCEFlow } = await import("./oauth");

        const oauthPromise = startPKCEFlow();
        await vi.waitFor(() => expect(shell.openExternal).toHaveBeenCalledTimes(1));

        handleAuthorizeCallback(`${OAUTH_CALLBACK_PATH}?code=test-auth-code&state=wrong-state`);

        await expect(oauthPromise).rejects.toThrow("Failed to extract authorization code");
        expect(fetch).not.toHaveBeenCalled();
    });
});
