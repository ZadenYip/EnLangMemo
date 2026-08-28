import { SyncChange } from "@enlangmemo/sync-api";
import { processingNotesTable } from "@main/db/schema/repetition/rep.js";
import { eq } from "drizzle-orm";
import { toInt } from "../../helper/type.js";
import type { RepTx } from "../../push/collector/change/rep-tx.js";
import { parseFields, remoteWins, upsertTombstone } from "./common.js";

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
        upsertTombstone(tx, change.entityType, id, Date.now());
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
            fields: parseFields(payload.fieldsJson),
        })
        .where(eq(processingNotesTable.id, id))
        .run();
}
