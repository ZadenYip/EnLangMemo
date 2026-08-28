import { getRepDb } from "@main/db/db.js";
import { bufferToHex, generateUUIDV7, hexToBuffer } from "@main/db/import/utils.js";
import { cardsTable, decksTable, notesTable } from "@main/db/schema/repetition/rep.js";
import type { NoteTemplate } from "@main/db/services/repetition/note-template/nt-tpl-service-types.js";
import type { NoteField, PcsNote } from "@main/db/services/repetition/processing-note/pcs-note-types.js";
import { and, count, eq, inArray, lte, SQL } from "drizzle-orm";
import { createEmptyCard } from "ts-fsrs";
import { getColConfig } from "../collection/col-service-helper.js";
import { resolveNewCardLimit } from "../deck/deck-service-helper.js";
import { mergeStudyCardsByDue, toFSRSCard } from "./card-mapper.js";
import { queryStudyCardsByQueue } from "./card-query.js";
import { createEmptyCardHandler, getNextReviewDayStart as calcNextReviewDayStart } from "./card-service-helper.js";
import { CardQueue, CardState, StudyCard, StudyCardRatingPreviews } from "./card-service-types.js";
import { buildRatingPreviews, getFsrsScheduler } from "./card-scheduler.js";
import { PendingLocalUsn } from "@main/sync/helper/usn.js";

// implementation of card service methods
export { clearFsrsSchedulerCache } from "./card-scheduler.js";
export { reviewCard } from "./card-review.js";

type RepTx = Parameters<Parameters<ReturnType<typeof getRepDb>["transaction"]>[0]>[0];

/**
 * Create a real note and one schedulable card from a processing note.
 */
export function createCardFromPcsNote(
    note: PcsNote,
    deckId: Buffer,
    noteTemplate: NoteTemplate,
    tx: RepTx,
): void {
    /** Current timestamp shared by the generated note and cards. */
    const now = Date.now();
    /** Generated permanent note id derived from the processing note content. */
    const noteId = generateUUIDV7();

    // insert the note record
    tx.insert(notesTable)
        .values({
            id: noteId,
            noteTypeId: hexToBuffer(note.noteTplId),
            usn: PendingLocalUsn,
            createdAt: now,
            updatedAt: now,
            senseId: note.senseId ?? null,
            sortField: resolveSortField(note.fields, noteTemplate.sortFieldId),
            searchFields: buildSearchFields(note.fields),
            fields: note.fields,
        })
        .run();

    // insert the card record, with initial FSRS scheduling values
    /** Initial card scheduling values reserved for the final FSRS implementation. */
    const card = createEmptyCard(new Date(), createEmptyCardHandler);
    tx.insert(cardsTable)
        .values({
            id: generateUUIDV7(),
            noteId,
            deckId,
            usn: PendingLocalUsn,
            updatedAt: now,
            difficulty: card.difficulty,
            stability: card.stability,
            scheduledDays: card.scheduledDays,
            due: card.due.getTime(),
            lastReview: card.lastReview ? card.lastReview.getTime() : null,
            lapses: card.lapses,
            learningSteps: card.learningSteps,
            repetitions: card.repetitions,
            state: card.state,
            queue: CardQueue.NEW,
        })
        .run();

}

/**
 * Count cards in the specified queues for one deck.
 */
export async function countCardsByDeckAndQueues(
    deckId: Buffer,
    queues: CardQueue[],
    dueBefore?: Date,
): Promise<number> {
    return countCardsByDeckQueuesAndStates(deckId, queues, undefined, dueBefore);
}

/**
 * Count cards in the specified queues and optional states for one deck.
 */
export async function countCardsByDeckQueuesAndStates(
    deckId: Buffer,
    queues: CardQueue[],
    states?: CardState[],
    dueBefore?: Date,
): Promise<number> {
    /** Query filters shared by card queue statistics. */
    const filters: SQL[] = [
        eq(cardsTable.deckId, deckId),
        inArray(cardsTable.queue, queues),
    ];
    if (states !== undefined) {
        filters.push(inArray(cardsTable.state, states));
    }
    if (dueBefore !== undefined) {
        filters.push(lte(cardsTable.due, dueBefore.getTime()));
    }

    const rows = await getRepDb()
        .select({
            value: count(),
        })
        .from(cardsTable)
        .where(and(...filters));

    return rows[0]?.value ?? 0;
}

/**
 * Get the next study cards for one deck.
 */
export async function getStudyCards(deckId: string, limit: number): Promise<StudyCard[]> {
    if (limit <= 0) {
        return [];
    }

    const deckIdBuffer = hexToBuffer(deckId);
    const deck = await getRepDb().query.decksTable.findFirst({
        where: eq(decksTable.id, deckIdBuffer),
        columns: {
            newCardsPerDay: true,
            newLearnedToday: true,
        },
    });
    if (!deck) {
        return [];
    }

    const collectionConfig = await getColConfig();
    const todayDueUpperBound = calcNextReviewDayStart(collectionConfig);
    const newCardLimit = resolveNewCardLimit(deck, limit);
    const [learningCards, reviewCards, newCards] = await Promise.all([
        queryStudyCardsByQueue(deckIdBuffer, CardQueue.LEARNING, limit, todayDueUpperBound),
        queryStudyCardsByQueue(deckIdBuffer, CardQueue.REVIEW, limit, todayDueUpperBound),
        queryStudyCardsByQueue(deckIdBuffer, CardQueue.NEW, newCardLimit, todayDueUpperBound),
    ]);

    return mergeStudyCardsByDue(
        [
            ...learningCards,
            ...reviewCards,
            ...newCards,
        ],
        limit,
    );
}

/**
 * Get the next review-day start timestamp for the current collection.
 */
export async function getNextReviewDayStart(): Promise<number> {
    const collectionConfig = await getColConfig();
    return calcNextReviewDayStart(collectionConfig);
}

/**
 * Get the four FSRS rating previews for one card at the current review time.
 */
export async function getStudyCardRatingPreviews(cardId: string): Promise<StudyCardRatingPreviews | null> {
    const cardRow = await getRepDb()
        .select({
            card: {
                deckId: cardsTable.deckId,
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
            deckConfig: decksTable.config,
        })
        .from(cardsTable)
        .innerJoin(decksTable, eq(cardsTable.deckId, decksTable.id))
        .where(eq(cardsTable.id, hexToBuffer(cardId)))
        .get();

    if (!cardRow) {
        return null;
    }

    const collectionConfig = await getColConfig();
    const deckId = bufferToHex(cardRow.card.deckId);
    const scheduler = getFsrsScheduler(deckId, cardRow.deckConfig.fsrsParams);
    return buildRatingPreviews(toFSRSCard(cardRow.card), collectionConfig, scheduler);
}

/**
 * Resolve sort field text from processing note fields.
 */
export function resolveSortField(fields: NoteField[], sortFieldId: number): string {
    // TODO 清洗html标签
    const field = fields.find((field) => field.id === String(sortFieldId));
    if (!field) {
        throw new Error(`Field with id "${sortFieldId}" not found.`);
    }
    return field.value;
}

/**
 * Build searchable plain text from all processing note field values.
 */
export function buildSearchFields(fields: NoteField[]): string {
    // TODO future: 清洗html标签
    return fields
        .map((field) => field.value.trim())
        .filter((value) => value.length > 0)
        .join(" ");
}
