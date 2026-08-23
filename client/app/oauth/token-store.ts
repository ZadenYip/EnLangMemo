import { dialog, safeStorage } from "electron/main";
import { TokenResponse } from "./token";
import path from "path";
import { getAccountDir } from "@main/paths";
import { getAppConfig } from "@main/db/config/config";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import Logger from "electron-log/main";


let token: Token | null = null;

export interface Token {
    /** Access token expiration timestamp in milliseconds. */
    expiresAt: number;
    /** OAuth access token stored only in the main process. */
    accessToken: string;
    /** OAuth token type, usually bearer. */
    tokenType: string;
}

export function saveToken(token: TokenResponse): void {
    if (!safeStorage.isEncryptionAvailable()) {
        showUnsupportEncryptionError();
        return;
    }

    // transform expires_in to expiresAt timestamp
    const expiresAt = Date.now() + token.expires_in * 1000;
    const tokenData = {
        expiresAt: expiresAt,
        accessToken: token.access_token,
        tokenType: token.token_type
    } as Token;

    const tokenPath = getTokenFilePath();
    
    const encrypted = safeStorage.encryptString(JSON.stringify(tokenData));
    writeFileSync(tokenPath, encrypted);
}

export function loadToken(): Token | null {
    if (token !== null) {
        if (token.expiresAt <= Date.now()) {
            clearToken();
            return null;
        }
        return token;
    }
    
    if (!safeStorage.isEncryptionAvailable()) {
        showUnsupportEncryptionError();
        return null;
    }

    const tokenPath = getTokenFilePath();

    if (!existsSync(tokenPath)) {
        return null;
    }

    const encrypted = readFileSync(tokenPath);
    const decrypted = safeStorage.decryptString(encrypted);

    try {
        token = JSON.parse(decrypted) as Token;
    } catch (error) {
        if (error instanceof SyntaxError) {
            Logger.error("Failed to parse token JSON:", error);
            clearToken();
            return null;
        }
    }

    return token;
}

export function clearToken(): void {
    const tokenPath = getTokenFilePath();
    if (existsSync(tokenPath)) {
        unlinkSync(tokenPath);
    }
    token = null;
}

function showUnsupportEncryptionError(): void {
    Logger.error("Safe storage is not available. Cannot save or load token securely.");
    dialog.showErrorBox(
        "Safe Storage Not Available",
        "Your system does not support safe storage. The application cannot securely store your access token. Please ensure you are running on a supported platform."
    );
}

function getTokenFilePath(): string {
    return path.join(getAccountDir(getAppConfig().selectedAccount), "token.bin");
}
