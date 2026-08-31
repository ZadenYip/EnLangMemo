import { EntityType, SyncChange } from "@enlangmemo/sync-api";
import { cardsTable, notesTable, noteTypesTable, processingNotesTable } from "@main/db/schema/repetition/rep.js";
import { eq } from "drizzle-orm";
import { toInt } from "@main/sync/helper/common.js";
import type { RepTx } from "@main/db/services/repetition/helper/type.js";
import {
    getRemoteDeletedAt,
    hasTombstone,
    parseJson,
    remoteWins,
} from "./common.js";
import { deleteTombstoneIfExists, upsertTombstone } from "@main/db/services/repetition/helper/delete.js";
import { NoteTemplate } from "@main/db/services/repetition/note-template/nt-tpl-service-types.js";

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
        if (hasTombstone(tx, id)) {
            return;
        }
        tx.insert(noteTypesTable).values({
            id,
            name: payload.name,
            presetTemplateId: payload.presetTemplateId,
            usn: toInt(change.usn),
            updatedAt: toInt(payload.updatedAt),
            noteTemplate: parseJson<NoteTemplate>(payload.noteTemplateJson),
        }).run();
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

export function isNoteTypeExists(tx: RepTx, noteTypeId: Buffer): boolean {
    const row = tx.select({ dummy: noteTypesTable.usn })
        .from(noteTypesTable)
        .where(eq(noteTypesTable.id, noteTypeId))
        .get();

    return row !== undefined;
}