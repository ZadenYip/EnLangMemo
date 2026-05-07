import * as fs from "fs";
import * as path from "path";
import { getAccountsDir } from "@main/paths";
import { ICollectionService } from "./col-service-interface";
import { getAppConfig, saveAppConfig } from "@main/db/config/config";
import { getRepDb, reInitDatabase } from "@main/db/db";
import Logger from "electron-log/main";
import { CollectionConfig } from "./col-service-types";
import { collectionTable } from "@main/db/schema/repetition/rep";

export class CollectionService implements ICollectionService {
    /**
     * List all collection folders under user_data/accounts/
     */
    async listCollections(): Promise<string[]> {
        const accountsDir = getAccountsDir();

        // Read all entries in accounts directory
        const entries = fs.readdirSync(accountsDir, { withFileTypes: true });

        // Filter only directories
        const collections: string[] = entries
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name);

        Logger.info(
            `Found ${collections.length} collection(s) in accounts directory`,
        );

        return collections;
    }

    /**
     * Create a new collection folder
     * **just folder without any files**
     * files should create when user switch to this collection
     */
    async createCollection(name: string): Promise<void> {
        const collectionPath = path.join(getAccountsDir(), name);

        // Check if collection already exists
        if (fs.existsSync(collectionPath)) {
            Logger.error(`Collection "${name}" already exists at path: ${collectionPath}`);
            throw new Error(`Collection "${name}" already exists`);
        }

        // Create the collection folder
        fs.mkdirSync(collectionPath, { recursive: true });
        Logger.info(`Created collection: ${name} at path: ${collectionPath}`);
    }

    /**
     * Delete a collection folder by name
     */
    async deleteCollection(name: string): Promise<void> {
        const collectionPath = path.join(getAccountsDir(), name);

        if (!fs.existsSync(collectionPath)) {
            Logger.error(`Collection "${name}" not found at path: ${collectionPath}`);
            throw new Error(`Collection "${name}" not found`);
        }

        fs.rmSync(collectionPath, { recursive: true, force: true });
        Logger.info(`Deleted collection: ${name}`);
    }

    /**
     * Get current active collection name
     */
    async getCurrentCollection(): Promise<string> {
        const config = getAppConfig();
        return config.selectedAccount;
    }

    /**
     * Switch to a different collection by name.
     * Updates config, reinitializes database, and saves configuration.
     */
    async switchCollection(collectionName: string): Promise<void> {
        const collectionPath = path.join(getAccountsDir(), collectionName);

        // Check if collection exists
        if (!fs.existsSync(collectionPath)) {
            Logger.error(`Collection "${collectionName}" not found at path: ${collectionPath}`);
            throw new Error(`Collection "${collectionName}" not found`);
        }

        // Update config
        const config = getAppConfig();
        config.selectedAccount = collectionName;

        // Save config to file and memory
        saveAppConfig(config);

        // Reinitialize database with new collection
        reInitDatabase(config);
        Logger.info(`Switched to collection: ${collectionName}`);
    }
    
    async getCollectionConfig(): Promise<CollectionConfig> {
        const collectionRecords = await getRepDb()
            .select({
                config: collectionTable.config,
            })
            .from(collectionTable);

        const collectionRecord = collectionRecords[0];
        return collectionRecord.config;
    }


    /**
     * Change the daily review reset time
     * @param resetTime hour in 24h format (0-23)
     */
    async changeColReviewRstTime(resetTime: number): Promise<void> {
        const repDb = getRepDb();
        const collectionRecords = await repDb
        .select({
                config: collectionTable.config
            })
        .from(collectionTable);
        const collectionRecord = collectionRecords[0];

        const collectionConfig = collectionRecord.config;
        const nextConfig: CollectionConfig = {
            ...collectionConfig,
            dailyResetTime: resetTime,
        };

        Logger.info(`Changed collection daily reset time to ${resetTime}:00`);

        repDb.update(collectionTable).set({
            config: nextConfig,
            usn: -1,
            updatedAt: Date.now(),
        }).run();
    }
}

