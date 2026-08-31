import { create } from "@bufbuild/protobuf";
import {
    ChangeOp,
    EntityType,
    ProcessingNotePayloadSchema,
    SyncChangeSchema,
} from "@enlangmemo/sync-api";
import type { SyncChange } from "@enlangmemo/sync-api";
import { getRepDb } from "@main/db/db.js";
import { processingNotesTable } from "@main/db/schema/repetition/rep.js";
import { and, asc, eq, gt } from "drizzle-orm";
import type { RepTx } from "@main/db/services/repetition/helper/type.js";
import { PendingLocalUsn } from "@main/sync/helper/usn.js";

/** Processing-note fields required to build one processing-note SyncChange. */
export type PcsChange = Pick<
    typeof processingNotesTable.$inferSelect,
    | "id"
    | "usn"
    | "noteTypeId"
    | "createdAt"
    | "updatedAt"
    | "senseId"
    | "fields"
>;

/**
 * getProcessingNotechanges
 */
export function getPcsChanges(limit: number, startAfterId: Buffer): PcsChange[] {
    return getRepDb()
        .select({
            id: processingNotesTable.id,
            usn: processingNotesTable.usn,
            noteTypeId: processingNotesTable.noteTypeId,
            createdAt: processingNotesTable.createdAt,
            updatedAt: processingNotesTable.updatedAt,
            senseId: processingNotesTable.senseId,
            fields: processingNotesTable.fields,
        })
        .from(processingNotesTable)
        .where(and(
            eq(processingNotesTable.usn, PendingLocalUsn),
            gt(processingNotesTable.id, startAfterId),
        ))
        .orderBy(asc(processingNotesTable.id))
        .limit(limit)
        .all();
}

/** Convert a pending processing-note ORM row into the protobuf SyncChange sent by Push. */
export function toPcsSyncChange(row: PcsChange): SyncChange {
    const payload = create(ProcessingNotePayloadSchema, {
        noteTypeId: row.noteTypeId,
        createdAt: BigInt(row.createdAt),
        updatedAt: BigInt(row.updatedAt),
        senseId: row.senseId ?? undefined,
        fieldsJson: JSON.stringify(row.fields),
    });

    return create(SyncChangeSchema, {
        entityId: row.id,
        entityType: EntityType.PROCESSING_NOTE,
        op: ChangeOp.UPSERT,
        usn: BigInt(PendingLocalUsn),
        payload: {
            case: "processingNote",
            value: payload,
        },
    });
}

export function assignPcsUsn(tx: RepTx, id: Buffer, usn: number): void {
    const result = tx.update(processingNotesTable)
        .set({ usn })
        .where(eq(processingNotesTable.id, id))
        .run();

    if (result.changes === 0) {
        throw new Error("processing-note row not found while assigning push usn.");
    }
}
