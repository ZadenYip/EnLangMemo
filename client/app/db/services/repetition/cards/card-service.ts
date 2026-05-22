import { getRepDb } from "@main/db/db";
import { generateUUIDV7, hexToBuffer } from "@main/db/import/utils";
import { cardsTable, notesTable } from "@main/db/schema/repetition/rep";
import type { NoteTemplate } from "@main/db/services/repetition/note-template/nt-tpl-service.types";
import type { PcsNote } from "@main/db/services/repetition/processing-note/pcs-note-types";
import { createEmptyCard } from "ts-fsrs";
import { createEmptyCardHandler } from "./card-service-helper";
import { CardQueue } from "./card-service-types";

/**
 * Create a real note and one card per card template from a processing note.
 */
export function creaCardsFromPcsNote(
    note: PcsNote,
    deckId: Buffer,
    noteTemplate: NoteTemplate,
): number {
    /** Number of cards created from the note template. */
    const cardCount = noteTemplate.cardtpls.length;

    getRepDb().transaction((tx) => {
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
    });

    return cardCount;
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
