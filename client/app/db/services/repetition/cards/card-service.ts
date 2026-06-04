import { getRepDb } from "@main/db/db";
import { bufferToHex, generateUUIDV7, hexToBuffer } from "@main/db/import/utils";
import { cardsTable, decksTable, notesTable } from "@main/db/schema/repetition/rep";
import type { NoteTemplate } from "@main/db/services/repetition/note-template/nt-tpl-service.types";
import type { PcsNote } from "@main/db/services/repetition/processing-note/pcs-note-types";
import { and, count, eq, inArray, lte, SQL } from "drizzle-orm";
import { createEmptyCard } from "ts-fsrs";
import { getColConfig } from "../collection/col-service-helper";
import { resolveNewCardLimit } from "../deck/deck-service-helper";
import { mergeStudyCardsByDue, toFSRSCard } from "./card-mapper";
import { queryStudyCardsByQueue } from "./card-query";
import { createEmptyCardHandler, getNextReviewDayStart as calcNextReviewDayStart } from "./card-service-helper";
import { CardQueue, CardState, StudyCard, StudyCardRatingPreviews } from "./card-service-types";
import { buildRatingPreviews, getFsrsScheduler } from "./card-scheduler";

// implementation of card service methods
export { clearFsrsSchedulerCache } from "./card-scheduler";
export { reviewCard } from "./card-review";

type RepTx = Parameters<Parameters<ReturnType<typeof getRepDb>["transaction"]>[0]>[0];

/**
 * Create a real note and one card per card template from a processing note.
 */
export function createCardsFromPcsNote(
    note: PcsNote,
    deckId: Buffer,
    noteTemplate: NoteTemplate,
    tx: RepTx,
): number {
    /** Number of cards created from the note template. */
    const cardCount = noteTemplate.cardtpls.length;

    /** Current timestamp shared by the generated note and cards. */
    const now = Date.now();
    /** Generated permanent note id derived from the processing note content. */
    const noteId = generateUUIDV7();

    tx.insert(notesTable)
        .values({
            id: noteId,
            noteTypeId: hexToBuffer(note.noteTplId),
            usn: -1,
            createdAt: now,
            updatedAt: now,
            senseId: note.senseId ? hexToBuffer(note.senseId) : null,
            sortField: resolveSortField(note, noteTemplate.sortField),
            searchFields: buildSearchFields(note),
            fields: note.fields,
        })
        .run();

    for (const cardTemplate of noteTemplate.cardtpls) {
        /** Initial card scheduling values reserved for the final FSRS implementation. */
        const card = createEmptyCard(new Date(), createEmptyCardHandler);
        tx.insert(cardsTable)
            .values({
                id: generateUUIDV7(),
                noteId,
                deckId,
                usn: -1,
                updatedAt: now,
                cardTemplateId: cardTemplate.id,
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

    return cardCount;
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
function resolveSortField(note: PcsNote, sortFieldId: number): string {
    // TODO 清洗html标签
    const field = note.fields.find((field) => field.id === String(sortFieldId));
    if (!field) {
        throw new Error(`Field with id "${sortFieldId}" not found.`);
    }
    return field.value;
}

/**
 * Build searchable plain text from all processing note field values.
 */
function buildSearchFields(note: PcsNote): string {
    // TODO future: 清洗html标签
    return note.fields
        .map((field) => field.value.trim())
        .filter((value) => value.length > 0)
        .join(" ");
}
