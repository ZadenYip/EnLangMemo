import { EntityType } from "@enlangmemo/sync-api";
import { collectionTable, noteTypesTable, tombstonesTable } from "@main/db/schema/repetition/rep.js";
import type { NoteField } from "@main/db/services/repetition/processing-note/pcs-note-types.js";
import { eq, lt } from "drizzle-orm";
import type { RepTx } from "../../push/collector/change/rep-tx.js";
import { resolveSortField } from "@main/db/services/repetition/cards/card-service.js";

export function remoteWins(remoteUpdatedAt: number, localUpdatedAt: number): boolean {
    return remoteUpdatedAt >= localUpdatedAt;
}

export function parseJson<T>(json: string): T {
    return JSON.parse(json) as T;
}

export function upsertTombstone(
    tx: RepTx,
    entityType: EntityType,
    entityId: Buffer,
    deletedAt: number,
): void {
    const existing = tx.select({ unitId: tombstonesTable.unitId })
        .from(tombstonesTable)
        .where(eq(tombstonesTable.unitId, entityId))
        .get();

    if (existing) {
        tx.update(tombstonesTable)
            .set({
                usn: -1,
                deletedAt,
                unitType: entityType,
            })
            .where(eq(tombstonesTable.unitId, entityId))
            .run();
        return;
    }

    tx.insert(tombstonesTable)
        .values({
            unitId: entityId,
            usn: -1,
            deletedAt,
            unitType: entityType,
        })
        .run();
}

export function resolveNoteSortField(tx: RepTx, noteTypeId: Buffer, fields: NoteField[]): string {
    const noteType = tx.select({ noteTemplate: noteTypesTable.noteTemplate })
        .from(noteTypesTable)
        .where(eq(noteTypesTable.id, noteTypeId))
        .get();
    if (!noteType) {
        throw new Error(`note type with id "${noteTypeId.toString("hex")}" not found.`);
    }

    const sortField = resolveSortField(fields, noteType.noteTemplate.sortFieldId);
    if (!sortField) {
        throw new Error(`sort field with id "${noteType.noteTemplate.sortFieldId}" not found in note fields.`);
    }

    return sortField;
}

export function updatePullSyncCursor(tx: RepTx, cursorUsn: number): void {
    const result = tx.update(collectionTable)
        .set({ syncCursorUsn: cursorUsn })
        .where(lt(collectionTable.syncCursorUsn, cursorUsn))
        .run();

    if (result.changes !== 1) {
        throw new Error(`failed to update pull sync cursor to ${cursorUsn}.`);
    }
}
