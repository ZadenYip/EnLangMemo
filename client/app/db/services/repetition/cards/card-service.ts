import { getRepDb } from "@main/db/db";
import { generateUUIDV7, hexToBuffer } from "@main/db/import/utils";
import { cardsTable, notesTable } from "@main/db/schema/repetition/rep";
import type { NoteTemplate } from "@main/db/services/repetition/note-template/nt-tpl-service.types";
import type { PcsNote } from "@main/db/services/repetition/processing-note/pcs-note-types";
import { createEmptyCard } from "ts-fsrs";
import { createEmptyCardHandler } from "./card-service-helper";
import { CARD_QUEUE, CardQueue } from "./card-service-types";
import { and, count, inArray, lte, eq } from "drizzle-orm";

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
                queue: CARD_QUEUE.NEW,
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
        .where(
            and(...filters),
        );

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
