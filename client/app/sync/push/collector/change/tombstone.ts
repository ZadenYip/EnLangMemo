import { create } from "@bufbuild/protobuf";
import {
    ChangeOp,
    EntityType,
    SyncChangeSchema,
} from "@enlangmemo/sync-api";
import type { SyncChange } from "@enlangmemo/sync-api";
import { getRepDb } from "@main/db/db.js";
import { tombstonesTable } from "@main/db/schema/repetition/rep.js";
import { and, asc, eq, gt } from "drizzle-orm";
import type { RepTx } from "./tx-types.js";

export type TombstoneChange = Pick<
    typeof tombstonesTable.$inferSelect,
    "unitId" | "usn" | "unitType" | "deletedAt"
>;

export function getTombstoneChanges(limit: number, startAfterId: Buffer): TombstoneChange[] {
    return getRepDb()
        .select({
            unitId: tombstonesTable.unitId,
            usn: tombstonesTable.usn,
            unitType: tombstonesTable.unitType,
            deletedAt: tombstonesTable.deletedAt,
        })
        .from(tombstonesTable)
        .where(and(
            eq(tombstonesTable.usn, -1),
            gt(tombstonesTable.unitId, startAfterId),
        ))
        .orderBy(asc(tombstonesTable.unitId))
        .limit(limit)
        .all();
}

/** Convert a pending tombstone ORM row into the protobuf DELETE SyncChange sent by Push. */
export function toTombstoneSyncChange(row: TombstoneChange): SyncChange {
    return create(SyncChangeSchema, {
        entityId: row.unitId,
        entityType: row.unitType as EntityType,
        op: ChangeOp.DELETE,
        deletedAt: BigInt(row.deletedAt),
        usn: BigInt(row.usn),
    });
}

export function deleteSyncedTombstone(tx: RepTx, unitId: Buffer): void {
    const result = tx.delete(tombstonesTable)
        .where(eq(tombstonesTable.unitId, unitId))
        .run();

    if (result.changes === 0) {
        throw new Error("tombstone row not found while deleting acknowledged tombstone.");
    }
}
