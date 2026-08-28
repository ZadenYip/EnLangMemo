import { SyncChange } from "@enlangmemo/sync-api";
import { reviewLogsTable } from "@main/db/schema/repetition/rep.js";
import { eq } from "drizzle-orm";
import { toInt } from "../../helper/type.js";
import type { RepTx } from "@main/db/services/repetition/helper/type.js";
import { deleteTombstoneIfExists, upsertTombstone } from "@main/db/services/repetition/helper/delete.js";

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
        upsertTombstone(tx, change.entityType, id, Date.now());
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
