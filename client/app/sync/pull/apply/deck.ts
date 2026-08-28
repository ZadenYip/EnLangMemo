import { EntityType, SyncChange } from "@enlangmemo/sync-api";
import { cardsTable, decksTable, notesTable } from "@main/db/schema/repetition/rep.js";
import { eq } from "drizzle-orm";
import { toInt } from "../../helper/type.js";
import type { RepTx } from "../../push/collector/change/rep-tx.js";
import {
    deleteTombstoneIfExists,
    getRemoteDeletedAt,
    parseJson,
    remoteWins,
    upsertTombstone,
} from "./common.js";

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
        upsertTombstone(tx, change.entityType, id, Date.now());
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

    const cards = tx.select({ id: cardsTable.id, noteId: cardsTable.noteId })
        .from(cardsTable)
        .where(eq(cardsTable.deckId, id))
        .all();
    for (const card of cards) {
        upsertTombstone(tx, EntityType.CARD, card.id, deletedAt);
        tx.delete(cardsTable)
            .where(eq(cardsTable.id, card.id))
            .run();

        const note = tx.select({ id: notesTable.id })
            .from(notesTable)
            .where(eq(notesTable.id, card.noteId))
            .get();
        if (note) {
            upsertTombstone(tx, EntityType.NOTE, note.id, deletedAt);
            tx.delete(notesTable)
                .where(eq(notesTable.id, note.id))
                .run();
        }
    }

    tx.delete(decksTable)
        .where(eq(decksTable.id, id))
        .run();
    deleteTombstoneIfExists(tx, id);
}
