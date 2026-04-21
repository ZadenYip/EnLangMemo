import { app, dialog } from "electron";
import * as path from "path";
import * as fs from "fs";
import Logger from "electron-log";
import { exit } from "process";
import { isDev } from "@main/main";


export interface AppConfig {
    selectedAccount: string;
}

/**
 * Load user configuration from config.json in user data directory.
 * If config.json doesn't exist, generate default config and save it.
 */
export function loadUserDataConfig(): AppConfig {
    // executable's directory/user_data
    const userDataDir = path.join(path.dirname(app.getPath("exe")), "user_data");
    const configPath = path.join(userDataDir, "config.json");
    
    if (fs.existsSync(configPath)) {
        try {
            const configContent = fs.readFileSync(configPath, "utf-8");
            return JSON.parse(configContent) as AppConfig;
        } catch (error) {
            Logger.error("Failed to load user data config:", error);
            return generateDefaultConfig();
        }
    } else {
        // Generate default config from resources
        const defaultConfig = generateDefaultConfig();
        
        // Save to config.json
        try {
            fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), "utf-8");
            Logger.info("Default config saved to", configPath);
        } catch (error) {
            Logger.warn("Failed to save config to", configPath, error);
        }
        
        return defaultConfig;
    }
}

/**
 * Generate default config file and return the default config object.
 */
function generateDefaultConfig(): AppConfig {
    try {
        // TODO 打包路径可能有问题，倒时候要处理
        const resourcesPath = isDev ? path.join(__dirname, "resources") : process.resourcesPath;
        const defaultConfigPath = path.join(resourcesPath, "config.default.json");

        if (fs.existsSync(defaultConfigPath)) {
            const defaultContent = fs.readFileSync(defaultConfigPath, "utf-8");
            return JSON.parse(defaultContent) as AppConfig;
        } else {
            Logger.error("Default config file not found at", defaultConfigPath);
            // Show error dialog to user
            dialog.showErrorBox(
                "Installation Error",
                "Default configuration file is missing. Please reinstall the application to fix this issue.",
            );
            exit(1);
        }
    } catch (error) {
        Logger.error("Failed to load default config from resources:", error);
        // Show error dialog to user
        dialog.showErrorBox(
            "Installation Error",
            "Failed to load default configuration. Please reinstall the application to fix this issue.",
        );
        exit(1);
    }
}
