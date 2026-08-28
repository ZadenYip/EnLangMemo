import { SyncChange } from "@enlangmemo/sync-api";
import { noteTypesTable } from "@main/db/schema/repetition/rep.js";
import { eq } from "drizzle-orm";
import { toInt } from "../../helper/type.js";
import type { RepTx } from "../../push/collector/change/rep-tx.js";
import { parseJson, remoteWins, upsertTombstone } from "./common.js";

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
