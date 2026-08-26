import { create } from "@bufbuild/protobuf";
import {
    ChangeOp,
    CollectionPayloadSchema,
    EntityType,
    SyncChange,
    SyncChangeSchema,
} from "@enlangmemo/sync-api";
import { getRepDb } from "@main/db/db.js";
import { collectionTable } from "@main/db/schema/repetition/rep.js";
import { eq, lt } from "drizzle-orm";
import type { RepTx } from "./rep-tx.js";
import Logger from "electron-log/main.js";

type ColChange = Pick<
    typeof collectionTable.$inferSelect,
    "id" | "sqliteSchemaVersion" | "createdAt" | "updatedAt" | "usn" | "config"
>;

/**
 * getColletionChange
 */
export function getColChange(): SyncChange | null {
    // get it without awaiting, because there is only one row in the collection table
    const row = getRepDb()
        .select({
            id: collectionTable.id,
            sqliteSchemaVersion: collectionTable.sqliteSchemaVersion,
            createdAt: collectionTable.createdAt,
            updatedAt: collectionTable.updatedAt,
            usn: collectionTable.usn,
            config: collectionTable.config,
        })
        .from(collectionTable)
        .where(eq(collectionTable.usn, -1))
        .get();
    if (!row) {
        return null;
    }

    return toColSyncChange(row);
}

/**
 * toCollectionSyncChange
 */
function toColSyncChange(row: ColChange): SyncChange {
    const payload = create(CollectionPayloadSchema, {
        sqliteSchemaVersion: row.sqliteSchemaVersion,
        createdAt: BigInt(row.createdAt),
        updatedAt: BigInt(row.updatedAt),
        configJson: JSON.stringify(row.config),
    });

    return create(SyncChangeSchema, {
        entityId: row.id,
        entityType: EntityType.COLLECTION,
        op: ChangeOp.UPSERT,
        usn: BigInt(row.usn),
        payload: {
            case: "collection",
            value: payload,
        },
    });
}

export function assignColUsn(tx: RepTx, id: Buffer, usn: number): void {
    const result = tx
        .update(collectionTable)
        .set({ usn })
        .where(eq(collectionTable.id, id))
        .run();

    if (result.changes === 0) {
        throw new Error("collection row not found while assigning push usn.");
    }
}

type CollectionRow = typeof collectionTable.$inferSelect;

export function getColRow(): CollectionRow {
    const row = getRepDb().select().from(collectionTable).all();
    if (row.length !== 1) {
        throw new Error("Collection row not found or multiple rows exist.");
    }

    return row[0];
}

export function updateCliSyncCursor(tx: RepTx, cursorUsn: number): void {
    const result = tx
        .update(collectionTable)
        .set({ syncCursorUsn: cursorUsn  })
        .where(lt(collectionTable.syncCursorUsn, cursorUsn))
        .run();

    if (result.changes !== 1) {
        Logger.error(
            `failed to update collection sync cursor to ${cursorUsn}, no rows were updated. Current cursor: ${getColRow().syncCursorUsn}`,
        );
        throw new Error(`failed to update collection sync cursor in updateCliSyncCursor().`);
    }
}