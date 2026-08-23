import { getRepDb } from "@main/db/db";
import { collectionTable } from "@main/db/schema/repetition/rep";

type CollectionRow = typeof collectionTable.$inferSelect;

export function getCollectionRow(): CollectionRow {
    const row = getRepDb().select().from(collectionTable).all();
    if (row.length !== 1) {
        throw new Error("Collection row not found or multiple rows exist.");
    }

    return row[0];
}