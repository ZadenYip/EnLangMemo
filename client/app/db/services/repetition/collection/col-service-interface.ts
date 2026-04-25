import { ProxyPropertyType } from "electron-ipc-cat/common";

export interface ICollectionService {
    /**
     * List all collection folders under user_data/accounts/
     * @returns array of collection folder names
     */
    listCollections(): Promise<string[]>;

    /**
     * Create a new collection folder
     * @param name collection folder name to create
     */
    createCollection(name: string): Promise<void>;

    /**
     * Delete a collection folder by name
     * @param name collection folder name to delete
     */
    deleteCollection(name: string): Promise<void>;

    /**
     * Get current active collection name
     * @returns the name of the currently selected account/collection
     */
    getCurrentCollection(): Promise<string>;

    /**
     * Read collection config from database
     */
    getCollectionConfig(): Promise<import("./col-service-types").CollectionConfig>;

    /**
     * Switch to a different collection by name
     * @param collectionName the name of the collection to switch to
     */
    switchCollection(collectionName: string): Promise<void>;

    /**
     * Change collection review reset time
     * @param resetTime hour in 24h format (0-23)
     */
    changeColReviewRstTime(resetTime: number): Promise<void>;
}

export const CollectionServiceIPCDescriptor = {
    channel: "collectionService",
    properties: {
        listCollections: ProxyPropertyType.Function,
        createCollection: ProxyPropertyType.Function,
        deleteCollection: ProxyPropertyType.Function,
        getCurrentCollection: ProxyPropertyType.Function,
        getCollectionConfig: ProxyPropertyType.Function,
        switchCollection: ProxyPropertyType.Function,
        changeColReviewRstTime: ProxyPropertyType.Function,
    },
};

