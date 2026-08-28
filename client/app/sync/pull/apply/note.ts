import { SyncChange } from "@enlangmemo/sync-api";
import { notesTable } from "@main/db/schema/repetition/rep.js";
import { eq } from "drizzle-orm";
import { toInt } from "../../helper/type.js";
import type { RepTx } from "../../push/collector/change/rep-tx.js";
import {
    parseJson,
    remoteWins,
    resolveNoteSortField,
    upsertTombstone,
} from "./common.js";
import { buildSearchFields } from "@main/db/services/repetition/cards/card-service.js";
import { NoteField } from "@main/db/services/repetition/processing-note/pcs-note-types.js";

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
        upsertTombstone(tx, change.entityType, id, Date.now());
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
