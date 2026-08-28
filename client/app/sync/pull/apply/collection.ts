import { SyncChange } from "@enlangmemo/sync-api";
import { collectionTable } from "@main/db/schema/repetition/rep.js";
import { eq } from "drizzle-orm";
import { toInt } from "../../helper/type.js";
import type { RepTx } from "../../push/collector/change/rep-tx.js";
import { parseJson, remoteWins } from "./common.js";

export function applyCollectionUpsert(tx: RepTx, change: SyncChange): void {
    if (change.payload.case !== "collection") {
        throw new Error(`expected collection payload, got ${change.payload.case}`);
    }

    const payload = change.payload.value;
    const id = Buffer.from(change.entityId);
    const row = tx.select({ updatedAt: collectionTable.updatedAt })
        .from(collectionTable)
        .where(eq(collectionTable.id, id))
        .get();
    if (!row) {
        throw new Error(`collection row not found for id ${id.toString("hex")} in applyCollectionUpsert`);
    }
    if (!remoteWins(toInt(payload.updatedAt), row.updatedAt)) {
        return;
    }
    tx.update(collectionTable)
        .set({
            // The schema version is managed separately and should not be overwritten by a sync change.
            // sqliteSchemaVersion: payload.sqliteSchemaVersion,
            usn: toInt(change.usn),
            createdAt: toInt(payload.createdAt),
            updatedAt: toInt(payload.updatedAt),
            config: parseJson(payload.configJson),
        })
        .where(eq(collectionTable.id, id))
        .run();
}
