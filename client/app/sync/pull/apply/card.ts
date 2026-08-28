import { SyncChange } from "@enlangmemo/sync-api";
import { cardsTable } from "@main/db/schema/repetition/rep.js";
import { eq } from "drizzle-orm";
import { toInt } from "../../helper/type.js";
import type { RepTx } from "../../push/collector/change/rep-tx.js";
import { remoteWins, upsertTombstone } from "./common.js";

export function applyCardUpsert(tx: RepTx, change: SyncChange): void {
    if (change.payload.case !== "card") {
        throw new Error(`expected card payload, got ${change.payload.case}`);
    }

    const payload = change.payload.value;
    const id = Buffer.from(change.entityId);
    const row = tx.select({ updatedAt: cardsTable.updatedAt })
        .from(cardsTable)
        .where(eq(cardsTable.id, id))
        .get();
    if (!row) {
        upsertTombstone(tx, change.entityType, id, Date.now());
        return;
    }
    if (!remoteWins(toInt(payload.updatedAt), row.updatedAt)) {
        return;
    }

    tx.update(cardsTable)
        .set({
            noteId: Buffer.from(payload.noteId),
            deckId: Buffer.from(payload.deckId),
            usn: toInt(change.usn),
            updatedAt: toInt(payload.updatedAt),
            difficulty: payload.difficulty,
            stability: payload.stability,
            scheduledDays: payload.scheduledDays,
            due: toInt(payload.due),
            lastReview: payload.lastReview !== undefined ? toInt(payload.lastReview) : null,
            lapses: payload.lapses,
            learningSteps: payload.learningSteps,
            repetitions: payload.repetitions,
            state: payload.state,
            queue: payload.queue,
        })
        .where(eq(cardsTable.id, id))
        .run();
}
