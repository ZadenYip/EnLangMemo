import * as fs from "fs";
import * as path from "path";
import Logger from "electron-log";
import { getAccountsDir } from "@main/paths";
import { ICollectionService } from "./collection-service-interface";

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
     * Delete a collection folder by name
     */
    async deleteCollection(name: string): Promise<void> {
        // TODO Review 改为如果触发异常失败
        const collectionPath = path.join(getAccountsDir(), name);

        if (!fs.existsSync(collectionPath)) {
            Logger.error(`Collection "${name}" not found at path: ${collectionPath}`);
            throw new Error(`Collection "${name}" not found`);
        }

        fs.rmSync(collectionPath, { recursive: true, force: true });
        Logger.info(`Deleted collection: ${name}`);
    }
}
