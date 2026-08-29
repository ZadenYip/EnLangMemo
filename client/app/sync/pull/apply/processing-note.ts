import { SyncChange } from "@enlangmemo/sync-api";
import { processingNotesTable } from "@main/db/schema/repetition/rep.js";
import { eq } from "drizzle-orm";
import { toInt } from "../../helper/type.js";
import type { RepTx } from "@main/db/services/repetition/helper/type.js";
import { hasTombstone, parseJson, remoteWins } from "./common.js";
import { deleteTombstoneIfExists, upsertTombstone } from "@main/db/services/repetition/helper/delete.js";
import { NoteField } from "@main/db/services/repetition/processing-note/pcs-note-types.js";
import { isNoteTypeExists } from "./note-type.js";

export function applyPcsNoteUpsert(tx: RepTx, change: SyncChange): void {
    if (change.payload.case !== "processingNote") {
        throw new Error(`expected processingNote payload, got ${change.payload.case}`);
    }

    const payload = change.payload.value;
    const id = Buffer.from(change.entityId);
    const row = tx.select({ updatedAt: processingNotesTable.updatedAt })
        .from(processingNotesTable)
        .where(eq(processingNotesTable.id, id))
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
        tx.insert(processingNotesTable).values({
            id,
            noteTypeId,
            usn: toInt(change.usn),
            createdAt: toInt(payload.createdAt),
            updatedAt: toInt(payload.updatedAt),
            senseId: payload.senseId,
            fields: parseJson<NoteField[]>(payload.fieldsJson),
        }).run();
        return;
    }
    if (!remoteWins(toInt(payload.updatedAt), row.updatedAt)) {
        return;
    }

    tx.update(processingNotesTable)
        .set({
            noteTypeId: Buffer.from(payload.noteTypeId),
            usn: toInt(change.usn),
            createdAt: toInt(payload.createdAt),
            updatedAt: toInt(payload.updatedAt),
            senseId: payload.senseId,
            fields: parseJson<NoteField[]>(payload.fieldsJson),
        })
        .where(eq(processingNotesTable.id, id))
        .run();
}

export function applyPcsNoteDelete(tx: RepTx, change: SyncChange): void {
    const id = Buffer.from(change.entityId);
    const row = tx.select({ id: processingNotesTable.id })
        .from(processingNotesTable)
        .where(eq(processingNotesTable.id, id))
        .get();

    if (!row) {
        deleteTombstoneIfExists(tx, id);
        return;
    }

    tx.delete(processingNotesTable)
        .where(eq(processingNotesTable.id, id))
        .run();
    deleteTombstoneIfExists(tx, id);
}
