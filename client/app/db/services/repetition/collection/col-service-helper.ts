import { getRepDb } from "@main/db/db";
import { collectionTable } from "@main/db/schema/repetition/rep";
import { ColConfig } from "./col-service-types";

/**
 * Read the current collection config from the repetition database.
 */
export async function getColConfig(): Promise<ColConfig> {
    const collectionRecords = await getRepDb()
        .select({
            config: collectionTable.config,
        })
        .from(collectionTable);

    const collectionRecord = collectionRecords[0];
    if (!collectionRecord) {
        throw new Error("Collection config not found.");
    }
    return collectionRecord.config;
}
