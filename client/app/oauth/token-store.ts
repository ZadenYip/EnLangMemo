import { safeStorage } from "electron/main";
import { TokenResponse } from "./token";
import path from "path";
import { getAccountDir } from "@main/paths";
import { getAppConfig } from "@main/db/config/config";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";

interface Token {
    expiresAt: number;
    accessToken: string;
    tokenType: string;
}

export function saveToken(token: TokenResponse): void {
    if (!safeStorage.isEncryptionAvailable()) {
        throw new Error("Safe storage is not available. Cannot save token securely.");
    }

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
    if (!safeStorage.isEncryptionAvailable()) {
        throw new Error("Safe storage is not available. Cannot load token securely.");
    }

    const tokenPath = getTokenFilePath();

    if (!existsSync(tokenPath)) {
        return null;
    }

    const encrypted = readFileSync(tokenPath);
    const decrypted = safeStorage.decryptString(encrypted);
    return JSON.parse(decrypted) as Token;
}

export function clearToken(): void {
    const tokenPath = getTokenFilePath();
    if (existsSync(tokenPath)) {
        unlinkSync(tokenPath);
    }
}

function getTokenFilePath(): string {
    return path.join(getAccountDir(getAppConfig().selectedAccount), "token.bin");
}