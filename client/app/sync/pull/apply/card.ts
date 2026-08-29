import { EntityType, SyncChange } from "@enlangmemo/sync-api";
import { cardsTable, decksTable, notesTable } from "@main/db/schema/repetition/rep.js";
import { eq } from "drizzle-orm";
import { toInt } from "../../helper/type.js";
import type { RepTx } from "@main/db/services/repetition/helper/type.js";
import {
    getRemoteDeletedAt,
    hasTombstone,
    remoteWins,
} from "./common.js";
import { deleteTombstoneIfExists, upsertTombstone } from "@main/db/services/repetition/helper/delete.js";
import { isNoteExists } from "./note.js";
import { isDeckExists } from "./deck.js";

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
        if (hasTombstone(tx, id)) {
            return;
        }
        const noteId = Buffer.from(payload.noteId);
        const deckId = Buffer.from(payload.deckId);

        const noteExists = isNoteExists(tx, noteId);
        const deckExists = isDeckExists(tx, deckId);
        if (!noteExists || !deckExists) {
            upsertTombstone(tx, change.entityType, id, Date.now());
            return;
        }

        tx.insert(cardsTable).values({
            id,
            noteId,
            deckId,
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
        }).run();
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

export function applyCardDelete(tx: RepTx, change: SyncChange): void {
    const id = Buffer.from(change.entityId);
    const deletedAt = getRemoteDeletedAt(change);
    const row = tx.select({ noteId: cardsTable.noteId })
        .from(cardsTable)
        .where(eq(cardsTable.id, id))
        .get();

    if (!row) {
        deleteTombstoneIfExists(tx, id);
        return;
    }

    tx.delete(cardsTable)
        .where(eq(cardsTable.id, id))
        .run();
    deleteTombstoneIfExists(tx, id);

    const note = tx.select({ id: notesTable.id })
        .from(notesTable)
        .where(eq(notesTable.id, row.noteId))
        .get();
    if (!note) {
        return;
    }

    upsertTombstone(tx, EntityType.NOTE, note.id, deletedAt);
    tx.delete(notesTable)
        .where(eq(notesTable.id, note.id))
        .run();
}
