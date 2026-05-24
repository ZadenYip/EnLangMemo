import { Grade } from "ts-fsrs";

export interface CardRef {
    /**
     * Card primary id in hex string format.
     */
    id: string;
}

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
     * -1 = suspended, 0, 1, 2, 3 same as state
     */
    queue: CardQueue;
}


// card-service-constants.ts
export const CARD_QUEUE = {
    SUSPENDED: -1,
    NEW: 0,
    LEARNING: 1,
    REVIEW: 2,
    RELEARNING: 3,
} as const satisfies Record<string, CardQueue>;
type CardQueue = -1 | 0 | 1 | 2 | 3;

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

export type FSRSRecordLog = Record<Grade, FSRSRecordLogItem>;

export interface FSRSIPreview extends FSRSRecordLog {
    [Symbol.iterator](): IterableIterator<FSRSRecordLogItem>;
}
