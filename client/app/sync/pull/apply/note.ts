import { EntityType, SyncChange } from "@enlangmemo/sync-api";
import { cardsTable, notesTable } from "@main/db/schema/repetition/rep.js";
import { eq } from "drizzle-orm";
import { toInt } from "@main/sync/helper/common.js";
import type { RepTx } from "@main/db/services/repetition/helper/type.js";
import {
    getRemoteDeletedAt,
    hasTombstone,
    parseJson,
    remoteWins,
    resolveNoteSortField,
} from "./common.js";
import { deleteTombstoneIfExists, upsertTombstone } from "@main/db/services/repetition/helper/delete.js";
import { buildSearchFields } from "@main/db/services/repetition/cards/card-service.js";
import { NoteField } from "@main/db/services/repetition/processing-note/pcs-note-types.js";
import { isNoteTypeExists } from "./note-type.js";

export function applyNoteUpsert(tx: RepTx, change: SyncChange): void {
    if (change.payload.case !== "note") {
        throw new Error(`expected note payload, got ${change.payload.case}`);
    }

    const payload = change.payload.value;
    const id = Buffer.from(change.entityId);
    const row = tx.select({ updatedAt: notesTable.updatedAt })
        .from(notesTable)
        .where(eq(notesTable.id, id))
        .get();
    if (!row) {
        if (hasTombstone(tx, id)) {
            return;
        }
        
        const noteTypeId = Buffer.from(payload.noteTypeId);
        
        if (!isNoteTypeExists(tx, noteTypeId)) {
            upsertTombstone(tx, change.entityType, id, Date.now());
            return;
        }

        const fields = parseJson<NoteField[]>(payload.fieldsJson);
        tx.insert(notesTable).values({
            id,
            noteTypeId,
            usn: toInt(change.usn),
            createdAt: toInt(payload.createdAt),
            updatedAt: toInt(payload.updatedAt),
            senseId: payload.senseId,
            sortField: resolveNoteSortField(tx, noteTypeId, fields),
            searchFields: buildSearchFields(fields),
            fields,
        }).run();
        return;
    }
    if (!remoteWins(toInt(payload.updatedAt), row.updatedAt)) {
        return;
    }

    const noteTypeId = Buffer.from(payload.noteTypeId);
    const fields = parseJson<NoteField[]>(payload.fieldsJson);
    tx.update(notesTable)
        .set({
            noteTypeId,
            usn: toInt(change.usn),
            createdAt: toInt(payload.createdAt),
            updatedAt: toInt(payload.updatedAt),
            senseId: payload.senseId,
            sortField: resolveNoteSortField(tx, noteTypeId, fields),
            searchFields: buildSearchFields(fields),
            fields,
        })
        .where(eq(notesTable.id, id))
        .run();
}

export function applyNoteDelete(tx: RepTx, change: SyncChange): void {
    const id = Buffer.from(change.entityId);
    const deletedAt = getRemoteDeletedAt(change);
    const row = tx.select({ id: notesTable.id })
        .from(notesTable)
        .where(eq(notesTable.id, id))
        .get();

    if (!row) {
        deleteTombstoneIfExists(tx, id);
        return;
    }

    const cards = tx.select({ id: cardsTable.id })
        .from(cardsTable)
        .where(eq(cardsTable.noteId, id))
        .all();
    for (const card of cards) {
        upsertTombstone(tx, EntityType.CARD, card.id, deletedAt);
        tx.delete(cardsTable)
            .where(eq(cardsTable.id, card.id))
            .run();
    }

    tx.delete(notesTable)
        .where(eq(notesTable.id, id))
        .run();
    deleteTombstoneIfExists(tx, id);
}

export function isNoteExists(tx: RepTx, noteId: Buffer): boolean {
    const row = tx.select({ dummy: notesTable.usn })
        .from(notesTable)
        .where(eq(notesTable.id, noteId))
        .get();

    return row !== undefined;
}