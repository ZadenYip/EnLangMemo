
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CollectionService } from "./col-service";

import { getAccountsDir, getUserDataDir } from "@main/paths";
import { getAppConfig, saveAppConfig } from "@main/db/config/config";
import { reInitDatabase } from "@main/db/db";


vi.mock(import("@main/main"), async () => ({
    isDev: true,
}));

vi.mock(import("@main/paths"), async (_importOriginal) => {
    return {
        getUserDataDir: vi.fn(),
        getAccountsDir: vi.fn(() => path.join(getUserDataDir(), "accounts")),
        getAccountDir: vi.fn((accountName: string) =>
            path.join(getUserDataDir(), "accounts", accountName),
        ),
    };
});

vi.mock(import("@main/db/config/config"), async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        getAppConfig: vi.fn(),
        saveAppConfig: vi.fn()
    };
});
vi.mock(import("@main/db/db"), async () => {
    return {
        reInitDatabase: vi.fn(),
        initDatabase: vi.fn(),
    };
});


describe("CollectionService", () => {
    let service: CollectionService;
    let tmpUserDataDir: string;

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Create a temporary directory for testing
        tmpUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "collection-test-user-data-"));
        fs.mkdirSync(path.join(tmpUserDataDir, "accounts"));
        
        service = new CollectionService();
        vi.mocked(getUserDataDir).mockReturnValue(tmpUserDataDir);
    });

    afterEach(() => {
        // Clean up the temporary directory
        if (fs.existsSync(tmpUserDataDir)) {
            fs.rmSync(tmpUserDataDir, { recursive: true, force: true });
        }
    });

    describe("listCollections", () => {
        it("should list collections from accounts directory", async () => {
            const accountsDir = getAccountsDir();
            // Create test collections
            fs.mkdirSync(path.join(accountsDir, "collection1"));
            fs.mkdirSync(path.join(accountsDir, "collection2"));
            
            // This is not a collection, should be ignored
            fs.writeFileSync(path.join(accountsDir, "file.txt"), "content");

            const result = await service.listCollections();

            expect(result).toEqual(expect.arrayContaining(["collection1", "collection2"]));
            expect(result).not.toContain("file.txt");
        });

        it("should return empty array when no collections exist", async () => {
            const result = await service.listCollections();

            expect(result).toEqual([]);
        });
    });

    describe("createCollection", () => {
        it("should create a new collection folder", async () => {
            const accountsDir = getAccountsDir();
            const collectionName = "new-collection";

            await service.createCollection(collectionName);

            const collectionPath = path.join(accountsDir, collectionName);
            expect(fs.existsSync(collectionPath)).toBe(true);
            expect(fs.statSync(collectionPath).isDirectory()).toBe(true);
        });

        it("should throw error if collection already exists", async () => {
            const accountsDir = getAccountsDir();
            const collectionName = "existing-collection";
            const collectionPath = path.join(accountsDir, collectionName);

            // Pre-create the collection
            fs.mkdirSync(collectionPath);

            await expect(service.createCollection(collectionName)).rejects.toThrow(
                // The error msg
                `Collection "${collectionName}" already exists`,
            );
        });
    });

    describe("deleteCollection", () => {
        it("should delete a collection folder", async () => {
            const accountsDir = getAccountsDir();
            const collectionName = "collection-to-delete";
            const collectionPath = path.join(accountsDir, collectionName);

            // Create the collection
            fs.mkdirSync(collectionPath);
            fs.writeFileSync(path.join(collectionPath, "test.txt"), "content");

            await service.deleteCollection(collectionName);

            expect(fs.existsSync(collectionPath)).toBe(false);
        });

        it("should throw error if collection does not exist", async () => {
            const collectionName = "non-existent";

            // The error msg
            await expect(service.deleteCollection(collectionName)).rejects.toThrow(
                `Collection "${collectionName}" not found`,
            );
        });
    });

    describe("getCurrentCollection", () => {
        it("should return current collection name from config", async () => {
            const mockConfig = { selectedAccount: "my-collection" };
            vi.mocked(getAppConfig).mockReturnValue(mockConfig);

            const result = await service.getCurrentCollection();

            expect(result).toBe("my-collection");

            expect(getAppConfig).toHaveBeenCalled();
        });
    });

    describe("switchCollection", () => {
        it("should switch to an existing collection", async () => {
            const accountsDir = getAccountsDir();
            const collectionName = "new-collection";
            const collectionPath = path.join(accountsDir, collectionName);

            // Create the collection
            fs.mkdirSync(collectionPath);

            const mockConfig = { selectedAccount: "old-collection" };
            vi.mocked(getAppConfig).mockReturnValue(mockConfig);

            await service.switchCollection(collectionName);

            expect(saveAppConfig).toHaveBeenCalledWith({
                selectedAccount: collectionName,
            });
            expect(reInitDatabase).toHaveBeenCalledWith({
                selectedAccount: collectionName,
            });
        });

        it("should throw error if collection does not exist", async () => {
            const collectionName = "non-existent";

            await expect(service.switchCollection(collectionName)).rejects.toThrow(
                // The error msg
                `Collection "${collectionName}" not found`,
            );

            expect(saveAppConfig).not.toHaveBeenCalled();
            expect(reInitDatabase).not.toHaveBeenCalled();
        });
    });
});