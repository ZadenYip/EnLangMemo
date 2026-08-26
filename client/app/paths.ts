import { app } from "electron";
import * as path from "path";
import { getAppConfig } from "./db/config/config.js";

/**
 * Get the base user data directory: <exe_dir>/user_data
 * This is where application user data is stored (configs, databases, etc.)
 */
export function getUserDataDir(): string {
    return path.join(path.dirname(app.getPath("exe")), "user_data");
}

/**
 * Get the accounts directory: <exe_dir>/user_data/accounts
 * This is where account-specific data is stored
 */
export function getAccountsDir(): string {
    return path.join(getUserDataDir(), "accounts");
}

/**
 * Get a specific account directory: <exe_dir>/user_data/accounts/<accountName>
 * @param accountName the account folder name
 */
export function getAccountDir(accountName: string): string {
    return path.join(getAccountsDir(), accountName);
}


export function getCurAccountDir(): string {
    if (!getAppConfig().selectedAccount) {
        throw new Error("No account selected in app config");
    }
    return getAccountDir(getAppConfig().selectedAccount);
}