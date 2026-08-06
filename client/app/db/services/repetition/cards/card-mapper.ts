import { bufferToHex } from "@main/db/import/utils";
import { cardsTable } from "@main/db/schema/repetition/rep";
import type { NoteTemplate } from "@main/db/services/repetition/note-template/nt-tpl-service-types";
import { CardQueue, FSRSCard, LangCard, StudyCard } from "./card-service-types";

export interface StudyCardRow {
    card: Pick<
        typeof cardsTable.$inferSelect,
        | "id"
        | "queue"
        | "difficulty"
        | "stability"
        | "scheduledDays"
        | "due"
        | "lastReview"
        | "lapses"
        | "learningSteps"
        | "repetitions"
        | "state"
    >;
    note: {
        id: Buffer;
        noteTypeId: Buffer;
        fields: StudyCard["note"]["fields"];
    };
    noteTemplate: NoteTemplate;
}

export type FSRSCardRow = Pick<
    typeof cardsTable.$inferSelect,
    | "difficulty"
    | "stability"
    | "scheduledDays"
    | "due"
    | "lastReview"
    | "lapses"
    | "learningSteps"
    | "repetitions"
    | "state"
>;

export function toStudyCard(row: StudyCardRow): StudyCard {
    const card = toFSRSCard(row.card);

    return {
        cardId: bufferToHex(row.card.id),
        queue: row.card.queue as CardQueue,
        card,
        note: {
            id: bufferToHex(row.note.id),
            noteTplId: bufferToHex(row.note.noteTypeId),
            fields: row.note.fields,
        },
        noteTpl: {
            css: row.noteTemplate.css,
            fields: row.noteTemplate.fields,
            front: row.noteTemplate.front,
            back: row.noteTemplate.back,
        },
    };
}

export function toLangCard(row: typeof cardsTable.$inferSelect): LangCard {
    return {
        id: bufferToHex(row.id),
        noteId: bufferToHex(row.noteId),
        deckId: bufferToHex(row.deckId),
        usn: row.usn,
        updatedAt: row.updatedAt,
        difficulty: row.difficulty,
        stability: row.stability,
        scheduledDays: row.scheduledDays,
        due: new Date(row.due),
        lastReview: row.lastReview === null ? undefined : new Date(row.lastReview),
        lapses: row.lapses,
        learningSteps: row.learningSteps,
        repetitions: row.repetitions,
        state: row.state,
        queue: row.queue as CardQueue,
    };
}

export function toFSRSCard(row: FSRSCardRow): FSRSCard {
    return {
        difficulty: row.difficulty,
        stability: row.stability,
        scheduledDays: row.scheduledDays,
        due: new Date(row.due),
        lastReview: row.lastReview === null ? undefined : new Date(row.lastReview),
        lapses: row.lapses,
        learningSteps: row.learningSteps,
        repetitions: row.repetitions,
        state: row.state,
    };
}

export function mergeStudyCardsByDue(cards: StudyCard[], limit: number): StudyCard[] {
    return [...cards]
        .sort((left: StudyCard, right: StudyCard) =>
            left.card.due.getTime() - right.card.due.getTime()
            || left.cardId.localeCompare(right.cardId))
        .slice(0, limit);
}
