import { create } from "@bufbuild/protobuf";
import { ChangeOp, CardPayloadSchema, EntityType, SyncChangeSchema } from "@enlangmemo/sync-api";
import type { SyncChange } from "@enlangmemo/sync-api";
import { getRepDb } from "@main/db/db.js";
import { cardsTable } from "@main/db/schema/repetition/rep.js";
import { and, asc, eq, gt } from "drizzle-orm";
import type { RepTx } from "@main/db/services/repetition/helper/type.js";
import { PendingLocalUsn } from "@main/sync/helper/usn.js";

export type CardChange = Pick<
    typeof cardsTable.$inferSelect,
    | "id"
    | "noteId"
    | "deckId"
    | "usn"
    | "updatedAt"
    | "difficulty"
    | "stability"
    | "scheduledDays"
    | "due"
    | "lastReview"
    | "lapses"
    | "learningSteps"
    | "repetitions"
    | "state"
    | "queue"
>;

export function getCardChanges(limit: number, startAfterId: Buffer): CardChange[] {
    return getRepDb()
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
            eq(cardsTable.usn, PendingLocalUsn),
            gt(cardsTable.id, startAfterId),
        ))
        .orderBy(asc(cardsTable.id))
        .limit(limit)
        .all();
}

export function toCardSyncChange(row: CardChange): SyncChange {
    const id = row.id;
    const usn = row.usn;
    const payload = create(CardPayloadSchema, {
        noteId: row.noteId,
        deckId: row.deckId,
        updatedAt: BigInt(row.updatedAt),
        difficulty: row.difficulty,
        stability: row.stability,
        scheduledDays: row.scheduledDays,
        due: BigInt(row.due),
        lastReview: row.lastReview !== null ? BigInt(row.lastReview) : undefined,
        lapses: row.lapses,
        learningSteps: row.learningSteps,
        repetitions: row.repetitions,
        state: row.state,
        queue: row.queue,
    });

    const syncChange = create(SyncChangeSchema, {
        entityId: id,
        entityType: EntityType.CARD,
        op: ChangeOp.UPSERT,
        usn: BigInt(usn),
        payload: {
            value: payload,
            case: "card",
        },
    });

    return syncChange;
}

export function assignCardUsn(tx: RepTx, id: Buffer, usn: number): void {
    const result = tx.update(cardsTable)
        .set({ usn })
        .where(eq(cardsTable.id, id))
        .run();

    if (result.changes === 0) {
        throw new Error("card row not found while assigning push usn.");
    }
}
