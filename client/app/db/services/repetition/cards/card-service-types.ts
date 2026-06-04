import { CardTemplate, TemplateField } from "../note-template/nt-tpl-service.types";
import { NoteField } from "../processing-note/pcs-note-types";

export interface CardRef {
    /**
     * Card primary id in hex string format.
     */
    id: string;
}

export const enum CardQueue {
    SUSPENDED = -1,
    NEW = 0,
    LEARNING = 1,
    REVIEW = 2,
}

export const enum CardState {
    NEW = 0,
    LEARNING = 1,
    REVIEW = 2,
    RELEARNING = 3,
}

export const enum CardRating {
    AGAIN = 1,
    HARD = 2,
    GOOD = 3,
    EASY = 4,
}

export type CardReviewRating =
    | CardRating.AGAIN
    | CardRating.HARD
    | CardRating.GOOD
    | CardRating.EASY;

export interface LangCard {
    /**
     * Card primary id in hex string format.
     */
    id: string;
    /**
     * Owner note id in hex string format.
     */
    noteId: string;
    /**
     * Owner deck id in hex string format.
     */
    deckId: string;
    /**
     * Sync sequence number.
     */
    usn: number;
    /**
     * Last updated timestamp in milliseconds.
     */
    updatedAt: number;

    /**
     * corresponding note template's card template business id
     */
    cardTemplateId: number;

    /**
     * FSRS difficulty.
     */
    difficulty: number;
    /**
     * FSRS stability.
     */
    stability: number;
    /**
     * current card interval in days
     */
    scheduledDays: number;

    /**
     * Next due timestamp.
     */
    due: Date;
    /**
     * Last review timestamp.
     */
    lastReview?: Date;
    /**
     * Lapse count.
     */
    lapses: number;
    /**
     * Current learning step index.
     */
    learningSteps: number;
    /**
     * repetition count
     */
    repetitions: number;
    /**
     * 0 = new, 1 = learning, 2 = review, 3 = relearning
     */
    state: number;
    /**
     * -1 = suspended, 0 = new, 1 = learning/relearning, 2 = review.
     */
    queue: CardQueue;
}

export interface StudyNoteTemplate {
    /**
     * Shared CSS from the note template.
     */
    css: string;
    /**
     * Field definitions needed to map note field values to template names.
     */
    fields: TemplateField[];
}

export interface StudyCardRatingPreview {
    /**
     * Next due time if this rating is selected.
     */
    due: Date;
    /**
     * Exact interval from preview time to the next due time in milliseconds.
     */
    intervalMs: number;
}

export type StudyCardRatingPreviews = Record<CardReviewRating, StudyCardRatingPreview>;

/**
 * Card, note, and template data needed by the learning page to render one card.
 */
export interface StudyCard {
    /**
     * Card primary id in hex string format, used when submitting review.
     */
    cardId: string;
    /**
     * Queue this card was selected from.
     */
    queue: CardQueue;
    /**
     * FSRS scheduling card selected for study.
     */
    card: FSRSCard;
    /**
     * Note field values owned by the card.
     */
    note: {
        id: string;
        noteTplId: string;
        fields: NoteField[];
    };
    /**
     * Lightweight note template data needed for rendering.
     */
    noteTpl: StudyNoteTemplate;
    /**
     * Card template used to render the current card.
     */
    cardTpl: CardTemplate;
}

export interface ReviewedCardState {
    /**
     * Reviewed card id in hex string format.
     */
    cardId: string;
    /**
     * Queue after the review result is applied.
     */
    queue: CardQueue;
    /**
     * Card state after the review result is applied.
     */
    state: CardState;
    /**
     * Next due timestamp in milliseconds.
     */
    due: number;
}

export type CardReviewResult =
    | {
        state: "success";
        card: ReviewedCardState;
    }
    | {
        state: "card-not-found" | "deck-not-found" | "invalid-rating";
    };

export type FSRSCard = Pick<
    LangCard,
    | "difficulty"
    | "stability"
    | "scheduledDays"
    | "due"
    | "lastReview"
    | "lapses"
    | "learningSteps"
    | "repetitions"
    | "state"
>

export interface FSRSReviewLog {
    reviewTime: Date;
    scheduledDays: number;
    rating: number;
    difficulty: number;
    stability: number;
    learningSteps: number;
    state: number;
}

export interface LangReviewLog extends FSRSReviewLog {
    id: string;
    cardId: string;
    usn: number;
    duration: number;
}

export interface FSRSRecordLogItem {
    card: FSRSCard;
    log: FSRSReviewLog;
}

export type FSRSRecordLog = Record<CardReviewRating, FSRSRecordLogItem>;

export interface FSRSIPreview extends FSRSRecordLog {
    [Symbol.iterator](): IterableIterator<FSRSRecordLogItem>;
}
