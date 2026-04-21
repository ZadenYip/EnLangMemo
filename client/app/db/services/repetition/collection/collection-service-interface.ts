import { ProxyPropertyType } from "electron-ipc-cat/common";

export interface ICollectionService {
    /**
     * List all collection folders under user_data/accounts/
     * @returns array of collection folder names
     */
    listCollections(): Promise<string[]>;

    /**
     * Delete a collection folder by name
     * @param name collection folder name to delete
     */
    deleteCollection(name: string): Promise<void>;
}

export const CollectionServiceIPCDescriptor = {
    channel: "collectionService",
    properties: {
        listCollections: ProxyPropertyType.Function,
        deleteCollection: ProxyPropertyType.Function,
    },
};
