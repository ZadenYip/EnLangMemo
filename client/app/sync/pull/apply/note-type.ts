import { EntityType, SyncChange } from "@enlangmemo/sync-api";
import { cardsTable, notesTable, noteTypesTable, processingNotesTable } from "@main/db/schema/repetition/rep.js";
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

export function applyNoteTypeUpsert(tx: RepTx, change: SyncChange): void {
    if (change.payload.case !== "noteType") {
        throw new Error(`expected noteType payload, got ${change.payload.case}`);
    }

    const payload = change.payload.value;
    const id = Buffer.from(change.entityId);
    const row = tx.select({ updatedAt: noteTypesTable.updatedAt })
        .from(noteTypesTable)
        .where(eq(noteTypesTable.id, id))
        .get();
    if (!row) {
        upsertTombstone(tx, change.entityType, id, Date.now());
        return;
    }
    if (!remoteWins(toInt(payload.updatedAt), row.updatedAt)) {
        return;
    }

    tx.update(noteTypesTable)
        .set({
            usn: toInt(change.usn),
            name: payload.name,
            presetTemplateId: payload.presetTemplateId,
            updatedAt: toInt(payload.updatedAt),
            noteTemplate: parseJson(payload.noteTemplateJson),
        })
        .where(eq(noteTypesTable.id, id))
        .run();
}

export function applyNoteTypeDelete(tx: RepTx, change: SyncChange): void {
    const id = Buffer.from(change.entityId);
    const deletedAt = getRemoteDeletedAt(change);
    const row = tx.select({ id: noteTypesTable.id })
        .from(noteTypesTable)
        .where(eq(noteTypesTable.id, id))
        .get();

    if (!row) {
        deleteTombstoneIfExists(tx, id);
        return;
    }

    const pcsNotes = tx.select({ id: processingNotesTable.id })
        .from(processingNotesTable)
        .where(eq(processingNotesTable.noteTypeId, id))
        .all();
    for (const pcsNote of pcsNotes) {
        upsertTombstone(tx, EntityType.PROCESSING_NOTE, pcsNote.id, deletedAt);
        tx.delete(processingNotesTable)
            .where(eq(processingNotesTable.id, pcsNote.id))
            .run();
    }

    const notes = tx.select({ id: notesTable.id })
        .from(notesTable)
        .where(eq(notesTable.noteTypeId, id))
        .all();
    for (const note of notes) {
        const cards = tx.select({ id: cardsTable.id })
            .from(cardsTable)
            .where(eq(cardsTable.noteId, note.id))
            .all();
        for (const card of cards) {
            upsertTombstone(tx, EntityType.CARD, card.id, deletedAt);
            tx.delete(cardsTable)
                .where(eq(cardsTable.id, card.id))
                .run();
        }

        upsertTombstone(tx, EntityType.NOTE, note.id, deletedAt);
        tx.delete(notesTable)
            .where(eq(notesTable.id, note.id))
            .run();
    }

    tx.delete(noteTypesTable)
        .where(eq(noteTypesTable.id, id))
        .run();
    deleteTombstoneIfExists(tx, id);
}
