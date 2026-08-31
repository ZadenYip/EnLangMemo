import { SyncChange } from "@enlangmemo/sync-api";
import { reviewLogsTable } from "@main/db/schema/repetition/rep.js";
import { eq } from "drizzle-orm";
import { toInt } from "@main/sync/helper/common.js";
import type { RepTx } from "@main/db/services/repetition/helper/type.js";
import { deleteTombstoneIfExists } from "@main/db/services/repetition/helper/delete.js";

export function applyReviewLogUpsert(tx: RepTx, change: SyncChange): void {
    if (change.payload.case !== "reviewLog") {
        throw new Error(`expected reviewLog payload, got ${change.payload.case}`);
    }

    const payload = change.payload.value;
    const id = Buffer.from(change.entityId);
    const row = tx.select({ id: reviewLogsTable.id })
        .from(reviewLogsTable)
        .where(eq(reviewLogsTable.id, id))
        .get();
    if (!row) {
        // If the review log does not exist, insert a new record
        // don't need to check cardId existence because the review log is a historical record.
        tx.insert(reviewLogsTable).values({
            id,
            cardId: Buffer.from(payload.cardId),
            usn: toInt(change.usn),
            reviewTime: toInt(payload.reviewTime),
            scheduledDays: payload.scheduledDays,
            rating: payload.rating,
            difficulty: payload.difficulty,
            stability: payload.stability,
            learningSteps: payload.learningSteps,
            state: payload.state,
            duration: payload.duration,
        }).run();
        return;
    }

    tx.update(reviewLogsTable)
        .set({
            cardId: Buffer.from(payload.cardId),
            usn: toInt(change.usn),
            reviewTime: toInt(payload.reviewTime),
            scheduledDays: payload.scheduledDays,
            rating: payload.rating,
            difficulty: payload.difficulty,
            stability: payload.stability,
            learningSteps: payload.learningSteps,
            state: payload.state,
            duration: payload.duration,
        })
        .where(eq(reviewLogsTable.id, id))
        .run();
}

export function applyReviewLogDelete(tx: RepTx, change: SyncChange): void {
    const id = Buffer.from(change.entityId);
    const row = tx.select({ id: reviewLogsTable.id })
        .from(reviewLogsTable)
        .where(eq(reviewLogsTable.id, id))
        .get();

    if (!row) {
        deleteTombstoneIfExists(tx, id);
        return;
    }

    tx.delete(reviewLogsTable)
        .where(eq(reviewLogsTable.id, id))
        .run();
    deleteTombstoneIfExists(tx, id);
}
