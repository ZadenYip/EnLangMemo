import { SyncChange } from "@enlangmemo/sync-api";
import { decksTable } from "@main/db/schema/repetition/rep.js";
import { eq } from "drizzle-orm";
import { toInt } from "../../helper/type.js";
import type { RepTx } from "@main/db/services/repetition/helper/type.js";
import {
    getRemoteDeletedAt,
    hasTombstone,
    parseJson,
    remoteWins,
} from "./common.js";
import { deleteDeckWithCascade, deleteTombstoneIfExists } from "@main/db/services/repetition/helper/delete.js";

export function applyDeckUpsert(tx: RepTx, change: SyncChange): void {
    if (change.payload.case !== "deck") {
        throw new Error(`expected deck payload, got ${change.payload.case}`);
    }

    const payload = change.payload.value;
    const id = Buffer.from(change.entityId);
    const row = tx.select({ updatedAt: decksTable.updatedAt })
        .from(decksTable)
        .where(eq(decksTable.id, id))
        .get();
    if (!row) {
        if (hasTombstone(tx, id)) {
            return;
        }
        tx.insert(decksTable).values({
            id,
            usn: toInt(change.usn),
            name: payload.name,
            updatedAt: toInt(payload.updatedAt),
            newCardsPerDay: payload.newCardsPerDay,
            newLearnedToday: payload.newLearnedToday,
            learnedToday: payload.learnedToday,
            reviewedToday: payload.reviewedToday,
            config: parseJson(payload.configJson),
        }).run();
        return;
    }
    if (!remoteWins(toInt(payload.updatedAt), row.updatedAt)) {
        return;
    }

    tx.update(decksTable)
        .set({
            usn: toInt(change.usn),
            name: payload.name,
            updatedAt: toInt(payload.updatedAt),
            newCardsPerDay: payload.newCardsPerDay,
            newLearnedToday: payload.newLearnedToday,
            learnedToday: payload.learnedToday,
            reviewedToday: payload.reviewedToday,
            config: parseJson(payload.configJson),
        })
        .where(eq(decksTable.id, id))
        .run();
}

export function applyDeckDelete(tx: RepTx, change: SyncChange): void {
    const id = Buffer.from(change.entityId);
    const deletedAt = getRemoteDeletedAt(change);
    const row = tx.select({ id: decksTable.id })
        .from(decksTable)
        .where(eq(decksTable.id, id))
        .get();

    if (!row) {
        deleteTombstoneIfExists(tx, id);
        return;
    }

    deleteDeckWithCascade(tx, id, deletedAt);
    deleteTombstoneIfExists(tx, id);
}

export function isDeckExists(tx: RepTx, deckId: Buffer): boolean {
    const row = tx.select({ dummy: decksTable.usn })
        .from(decksTable)
        .where(eq(decksTable.id, deckId))
        .get();

    return row !== undefined;
}