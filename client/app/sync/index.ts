import { createConnectTransport } from "@connectrpc/connect-node";
import { createClient, type Client, type Interceptor } from "@connectrpc/connect";
import { APP_API_BASE_URL } from "@main/env/env";
import { SyncService } from "@enlangmemo/sync-api";
import { loadToken } from "@main/oauth/token-store";

type SyncClient = Client<typeof SyncService>;

let syncClient: SyncClient;

/**
 * OAuth token interceptor for the SyncClient. 
 * This interceptor automatically adds the Authorization header with the Bearer token to each request 
 * if a valid token is available.
 * @param next 
 * @returns
 */
const authInterceptor: Interceptor = (next) => async (req) => {
    const token = loadToken();

    if (!token) {
        return await next(req);
    }

    req.header.set("Authorization", `Bearer ${token.accessToken}`);
    return await next(req);
};

export function initSyncClient(): void {
    const transport = createConnectTransport({
        httpVersion: "1.1",
        baseUrl: APP_API_BASE_URL,
        interceptors: [authInterceptor],
    });

    syncClient = createClient(SyncService, transport);

}

/**
 * GET the initialized SyncClient instance.
 * @throws Error if the SyncClient has not been initialized.
 * @returns The initialized SyncClient instance.
 */
export function getClient(): SyncClient {
    if (!syncClient) {
        throw new Error("Sync client has not been initialized.");
    }

    return syncClient;
}
