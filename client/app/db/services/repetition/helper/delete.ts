import { EntityType } from "@enlangmemo/sync-api";
import { cardsTable, decksTable, notesTable, tombstonesTable } from "@main/db/schema/repetition/rep.js";
import { RepTx } from "./type.js";
import { PendingLocalUsn } from "@main/sync/helper/usn.js";
import { eq } from "drizzle-orm/sql/expressions/conditions";
import Logger from "electron-log/main.js";

/**
 * Deletes a deck and all its associated cards and notes, and creates tombstones for each deleted entity.
 */
export function deleteDeckWithCascade(tx: RepTx, id: Buffer, deletedAt: number): void {
    Logger.info(`deleting deck with ID ${id.toString("hex")} and cascading to associated cards and notes.`);
    const cards = tx.select({ id: cardsTable.id, noteId: cardsTable.noteId })
        .from(cardsTable)
        .where(eq(cardsTable.deckId, id))
        .all();
        
    for (const card of cards) {
        Logger.info(`deleting card with ID ${card.id.toString("hex")} associated with deck ID ${id.toString("hex")}`);
        upsertTombstone(tx, EntityType.CARD, card.id, deletedAt);
        tx.delete(cardsTable)
            .where(eq(cardsTable.id, card.id))
            .run();

        const note = tx.select({ id: notesTable.id })
            .from(notesTable)
            .where(eq(notesTable.id, card.noteId))
            .get();
        if (note) {
            Logger.info(`deleting note with ID ${note.id.toString("hex")} associated with card ID ${card.id.toString("hex")}`);
            upsertTombstone(tx, EntityType.NOTE, note.id, deletedAt);
            tx.delete(notesTable)
                .where(eq(notesTable.id, note.id))
                .run();
        }
    }

    tx.delete(decksTable)
        .where(eq(decksTable.id, id))
        .run();
    upsertTombstone(tx, EntityType.DECK, id, deletedAt);
}

export function upsertTombstone(
    tx: RepTx,
    entityType: EntityType,
    entityId: Buffer,
    deletedAt: number
): void {
    tx.insert(tombstonesTable)
        .values({
            unitId: entityId,
            usn: PendingLocalUsn,
            deletedAt,
            unitType: entityType,
        })
        .onConflictDoUpdate({
            target: tombstonesTable.unitId,
            set: {
                usn: PendingLocalUsn,
                deletedAt,
                unitType: entityType,
            },
        })
        .run();
}

export function deleteTombstoneIfExists(tx: RepTx, entityId: Buffer): void {
    tx.delete(tombstonesTable)
        .where(eq(tombstonesTable.unitId, entityId))
        .run();
}
