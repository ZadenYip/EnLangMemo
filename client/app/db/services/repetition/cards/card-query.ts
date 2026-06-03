import { getRepDb } from "@main/db/db";
import { cardsTable, notesTable, noteTypesTable } from "@main/db/schema/repetition/rep";
import { and, asc, eq, lte, SQL } from "drizzle-orm";
import { CardQueue, StudyCard } from "./card-service-types";
import { toStudyCard } from "./card-mapper";

/**
 * Query due study cards from one queue for one deck.
 */
export async function queryStudyCardsByQueue(
    deckId: Buffer,
    queue: CardQueue,
    limit: number,
    dueUpperBound: number,
): Promise<StudyCard[]> {
    const filters: SQL[] = [
        eq(cardsTable.deckId, deckId),
        eq(cardsTable.queue, queue),
    ];
    if (dueUpperBound !== undefined) {
        filters.push(lte(cardsTable.due, dueUpperBound));
    }

    const rows = await getRepDb()
        .select({
            card: {
                id: cardsTable.id,
                queue: cardsTable.queue,
                cardTemplateId: cardsTable.cardTemplateId,
                difficulty: cardsTable.difficulty,
                stability: cardsTable.stability,
                scheduledDays: cardsTable.scheduledDays,
                due: cardsTable.due,
                lastReview: cardsTable.lastReview,
                lapses: cardsTable.lapses,
                learningSteps: cardsTable.learningSteps,
                repetitions: cardsTable.repetitions,
                state: cardsTable.state,
            },
            note: {
                id: notesTable.id,
                noteTypeId: notesTable.noteTypeId,
                fields: notesTable.fields,
            },
            noteTemplate: noteTypesTable.noteTemplate,
        })
        .from(cardsTable)
        .innerJoin(notesTable, eq(cardsTable.noteId, notesTable.id))
        .innerJoin(noteTypesTable, eq(notesTable.noteTypeId, noteTypesTable.id))
        .where(and(...filters))
        .orderBy(asc(cardsTable.due), asc(cardsTable.id))
        .limit(limit);

    return rows.map((row) => toStudyCard(row));
}
