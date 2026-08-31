import { create } from "@bufbuild/protobuf";
import { ChangeOp, EntityType, NotePayloadSchema, SyncChange, SyncChangeSchema } from "@enlangmemo/sync-api";
import { getRepDb } from "@main/db/db.js";
import { cardsTable, notesTable } from "@main/db/schema/repetition/rep.js";
import { and, asc, eq, gt } from "drizzle-orm";
import { getUnsyncedReviewLogsByCardId, ReviewLogChange } from "./review-log.js";
import { CardChange } from "./card.js";
import type { RepTx } from "@main/db/services/repetition/helper/type.js";
import { PendingLocalUsn } from "@main/sync/helper/usn.js";

type NoteChange = Pick<
    typeof notesTable.$inferSelect,
    | "id"
    | "noteTypeId"
    | "createdAt"
    | "updatedAt"
    | "usn"
    | "senseId"
    | "fields"
>;


/** Unsynced card and review-log children for one note sync unit. */
export interface NoteSyncUnitChildren {
    card: CardChange | null;
    reviewLogs: ReviewLogChange[];
}

export function getNoteChanges(limit: number, startAfterId: Buffer): NoteChange[] {
    const notes = getRepDb()
        .select({
            id: notesTable.id,
            noteTypeId: notesTable.noteTypeId,
            createdAt: notesTable.createdAt,
            updatedAt: notesTable.updatedAt,
            usn: notesTable.usn,
            senseId: notesTable.senseId,
            fields: notesTable.fields,
        })
        .from(notesTable)
        .where(and(
            eq(notesTable.usn, PendingLocalUsn),
            gt(notesTable.id, startAfterId),
        ))
        .orderBy(asc(notesTable.id))
        .limit(limit)
        .all();

    return notes;
}

/**
 * 
 * @param note - The note to fetch unsynced children for.
 * @returns An object containing the unsynced card and review logs for the specified note.
 */
export function getUnsyncedNoteCascade(note: NoteChange): NoteSyncUnitChildren {
    const cards = getRepDb()
        .select({
            id: cardsTable.id,
            noteId: cardsTable.noteId,
            deckId: cardsTable.deckId,
            usn: cardsTable.usn,
            updatedAt: cardsTable.updatedAt,
            difficulty: cardsTable.difficulty,
            stability: cardsTable.stability,
            scheduledDays: cardsTable.scheduledDays,
            due: cardsTable.due,
            lastReview: cardsTable.lastReview,
            lapses: cardsTable.lapses,
            learningSteps: cardsTable.learningSteps,
            repetitions: cardsTable.repetitions,
            state: cardsTable.state,
            queue: cardsTable.queue,
        })
        .from(cardsTable)
        .where(and(
            eq(cardsTable.noteId, note.id),
            eq(cardsTable.usn, PendingLocalUsn),
        ))
        .limit(2)
        .all();

    if (cards.length > 1) {
        throw new Error("Expected at most one unsynced card for one note.");
    }

    const card = cards[0] ?? null;
    const reviewLogs = card
        ? getUnsyncedReviewLogsByCardId(card.id)
        : [];

    return { card, reviewLogs };
}

export function toNoteSyncChange(row: NoteChange): SyncChange {
    const id = row.id;
    const usn = row.usn;
    const payload = create(NotePayloadSchema, {
        noteTypeId: row.noteTypeId,
        createdAt: BigInt(row.createdAt),
        updatedAt: BigInt(row.updatedAt),
        senseId: row.senseId ?? undefined,
        fieldsJson: JSON.stringify(row.fields),
    });

    return create(SyncChangeSchema, {
        entityId: id,
        entityType: EntityType.NOTE,
        op: ChangeOp.UPSERT,
        usn: BigInt(usn),
        payload: {
            case: "note",
            value: payload,
        },
    });
}

export function assignNoteUsn(tx: RepTx, id: Buffer, usn: number): void {
    const result = tx.update(notesTable)
        .set({ usn })
        .where(eq(notesTable.id, id))
        .run();

    if (result.changes === 0) {
        throw new Error("note row not found while assigning push usn.");
    }
}
