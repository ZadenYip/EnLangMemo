import { create } from "@bufbuild/protobuf";
import {
    ChangeOp,
    DeckPayloadSchema,
    EntityType,
    SyncChangeSchema,
} from "@enlangmemo/sync-api";
import type { SyncChange } from "@enlangmemo/sync-api";
import { getRepDb } from "@main/db/db.js";
import { decksTable } from "@main/db/schema/repetition/rep.js";
import { and, asc, eq, gt } from "drizzle-orm";
import type { RepTx } from "./rep-tx.js";
import { PendingLocalUsn } from "@main/sync/helper/usn.js";

type DeckChange = Pick<
    typeof decksTable.$inferSelect,
    | "id"
    | "usn"
    | "name"
    | "updatedAt"
    | "newCardsPerDay"
    | "newLearnedToday"
    | "learnedToday"
    | "reviewedToday"
    | "config"
>;

export function getDeckChanges(limit: number, startAfterId: Buffer): DeckChange[] {
    return getRepDb()
        .select({
            id: decksTable.id,
            usn: decksTable.usn,
            name: decksTable.name,
            updatedAt: decksTable.updatedAt,
            newCardsPerDay: decksTable.newCardsPerDay,
            newLearnedToday: decksTable.newLearnedToday,
            learnedToday: decksTable.learnedToday,
            reviewedToday: decksTable.reviewedToday,
            config: decksTable.config,
        })
        .from(decksTable)
        .where(and(
            eq(decksTable.usn, PendingLocalUsn),
            gt(decksTable.id, startAfterId),
        ))
        .orderBy(asc(decksTable.id))
        .limit(limit)
        .all();
}

export function toDeckSyncChange(row: DeckChange): SyncChange {
    const payload = create(DeckPayloadSchema, {
        name: row.name,
        updatedAt: BigInt(row.updatedAt),
        newCardsPerDay: row.newCardsPerDay,
        newLearnedToday: row.newLearnedToday,
        learnedToday: row.learnedToday,
        reviewedToday: row.reviewedToday,
        configJson: JSON.stringify(row.config),
    });

    return create(SyncChangeSchema, {
        entityId: row.id,
        entityType: EntityType.DECK,
        op: ChangeOp.UPSERT,
        usn: BigInt(PendingLocalUsn),
        payload: {
            case: "deck",
            value: payload,
        },
    });
}

/** Assign the server-confirmed USN to the local deck row. */
export function assignDeckUsn(tx: RepTx, id: Buffer, usn: number): void {
    const result = tx.update(decksTable)
        .set({ usn })
        .where(eq(decksTable.id, id))
        .run();

    if (result.changes === 0) {
        throw new Error("deck row not found while assigning push usn.");
    }
}
