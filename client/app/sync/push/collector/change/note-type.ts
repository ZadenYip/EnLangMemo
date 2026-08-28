import { create } from "@bufbuild/protobuf";
import {
    ChangeOp,
    EntityType,
    NoteTypePayloadSchema,
    SyncChangeSchema,
} from "@enlangmemo/sync-api";
import type { SyncChange } from "@enlangmemo/sync-api";
import { getRepDb } from "@main/db/db.js";
import { noteTypesTable } from "@main/db/schema/repetition/rep.js";
import { and, asc, eq, gt } from "drizzle-orm";
import type { RepTx } from "@main/db/services/repetition/helper/type.js";
import { PendingLocalUsn } from "@main/sync/helper/usn.js";

type NoteTypeChange = Pick<
    typeof noteTypesTable.$inferSelect,
    | "id"
    | "usn"
    | "name"
    | "presetTemplateId"
    | "updatedAt"
    | "noteTemplate"
>;

export function getNoteTypeChangeRows(limit: number, startAfterId: Buffer): NoteTypeChange[] {
    return getRepDb()
        .select({
            id: noteTypesTable.id,
            usn: noteTypesTable.usn,
            name: noteTypesTable.name,
            presetTemplateId: noteTypesTable.presetTemplateId,
            updatedAt: noteTypesTable.updatedAt,
            noteTemplate: noteTypesTable.noteTemplate,
        })
        .from(noteTypesTable)
        .where(and(
            eq(noteTypesTable.usn, PendingLocalUsn),
            gt(noteTypesTable.id, startAfterId),
        ))
        .orderBy(asc(noteTypesTable.id))
        .limit(limit)
        .all();
}

export function toNoteTypeSyncChange(row: NoteTypeChange): SyncChange {
    const payload = create(NoteTypePayloadSchema, {
        name: row.name,
        presetTemplateId: row.presetTemplateId,
        updatedAt: BigInt(row.updatedAt),
        noteTemplateJson: JSON.stringify(row.noteTemplate),
    });

    return create(SyncChangeSchema, {
        entityId: row.id,
        entityType: EntityType.NOTE_TYPE,
        op: ChangeOp.UPSERT,
        usn: BigInt(PendingLocalUsn),
        payload: {
            case: "noteType",
            value: payload,
        },
    });
}

export function assignNoteTypeUsn(tx: RepTx, id: Buffer, usn: number): void {
    const result = tx.update(noteTypesTable)
        .set({ usn })
        .where(eq(noteTypesTable.id, id))
        .run();

    if (result.changes === 0) {
        throw new Error("note-type row not found while assigning push usn.");
    }
}
