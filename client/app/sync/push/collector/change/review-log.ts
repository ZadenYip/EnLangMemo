import { create } from "@bufbuild/protobuf";
import { ChangeOp, EntityType, ReviewLogPayloadSchema, SyncChange, SyncChangeSchema } from "@enlangmemo/sync-api";
import { getRepDb } from "@main/db/db.js";
import { reviewLogsTable } from "@main/db/schema/repetition/rep.js";
import { and, asc, eq, gt } from "drizzle-orm";
import type { RepTx } from "./rep-tx.js";

export type ReviewLogChange = Pick<
    typeof reviewLogsTable.$inferSelect,
    | "id"
    | "cardId"
    | "usn"
    | "reviewTime"
    | "scheduledDays"
    | "rating"
    | "difficulty"
    | "stability"
    | "learningSteps"
    | "state"
    | "duration"
>;

/** Read pending local review-log rows, fetching one extra row to detect limit truncation. */
export function getReviewChanges(limit: number, startAfterId: Buffer): ReviewLogChange[] {
    return getRepDb()
        .select({
            id: reviewLogsTable.id,
            cardId: reviewLogsTable.cardId,
            usn: reviewLogsTable.usn,
            reviewTime: reviewLogsTable.reviewTime,
            scheduledDays: reviewLogsTable.scheduledDays,
            rating: reviewLogsTable.rating,
            difficulty: reviewLogsTable.difficulty,
            stability: reviewLogsTable.stability,
            learningSteps: reviewLogsTable.learningSteps,
            state: reviewLogsTable.state,
            duration: reviewLogsTable.duration,
        })
        .from(reviewLogsTable)
        .where(and(
            eq(reviewLogsTable.usn, -1),
            gt(reviewLogsTable.id, startAfterId),
        ))
        .orderBy(asc(reviewLogsTable.id))
        .limit(limit)
        .all();
}

/**
 * 
 * @param cardId - The card ID to fetch unsynced review logs for.
 * @returns An array of unsynced review logs for the specified card.
 */
export function getUnsyncedReviewLogsByCardId(cardId: Buffer): ReviewLogChange[] {
    return getRepDb()
        .select({
            id: reviewLogsTable.id,
            cardId: reviewLogsTable.cardId,
            usn: reviewLogsTable.usn,
            reviewTime: reviewLogsTable.reviewTime,
            scheduledDays: reviewLogsTable.scheduledDays,
            rating: reviewLogsTable.rating,
            difficulty: reviewLogsTable.difficulty,
            stability: reviewLogsTable.stability,
            learningSteps: reviewLogsTable.learningSteps,
            state: reviewLogsTable.state,
            duration: reviewLogsTable.duration,
        })
        .from(reviewLogsTable)
        .where(and(
            eq(reviewLogsTable.cardId, cardId),
            eq(reviewLogsTable.usn, -1),
        ))
        .orderBy(asc(reviewLogsTable.reviewTime), asc(reviewLogsTable.id))
        .all();
}

export function toReviewLogSyncChange(row: ReviewLogChange): SyncChange {
    const id = row.id;
    const usn = row.usn;
    const payload = create(ReviewLogPayloadSchema, {
        cardId: row.cardId,
        reviewTime: BigInt(row.reviewTime),
        scheduledDays: row.scheduledDays,
        rating: row.rating,
        difficulty: row.difficulty,
        stability: row.stability,
        learningSteps: row.learningSteps,
        state: row.state,
        duration: row.duration,
    });

    return create(SyncChangeSchema, {
        entityId: id,
        entityType: EntityType.REVIEW_LOG,
        op: ChangeOp.UPSERT,
        usn: BigInt(usn),
        payload: {
            case: "reviewLog",
            value: payload,
        },
    });
}

export function assignReviewLogUsn(tx: RepTx, id: Buffer, usn: number): void {
    const result = tx.update(reviewLogsTable)
        .set({ usn })
        .where(eq(reviewLogsTable.id, id))
        .run();

    if (result.changes === 0) {
        throw new Error("review-log row not found while assigning push usn.");
    }
}
