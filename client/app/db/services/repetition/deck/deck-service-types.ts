import type { FSRSParameters } from "ts-fsrs";

export interface DeckConfig {
    /**
     * Persisted FSRS scheduler parameters for this deck.
     */
    fsrsParams: FSRSParameters;
}

export interface DeckSettings extends DeckConfig {
    /**
     * The maximum number of new cards can be learned per day in this deck.
     * -1 means no limit.
     */
    newCardsPerDay: number;
}

export interface Deck {
    /**
     * Deck primary id in hex string format.
     */
    id: string;

    /**
     * Deck display name.
     */
    name: string;

    /**
     * The maximum number of new cards can be learned per day.
     */
    newCardsPerDay: number;

    /**
     * The number of cards currently in the new queue.
     */
    newCards: number;

    /**
     * The number of cards can learn today in this deck.
     * deck.newCardsPerDay - deck.newLearnedToday
     */
    canLearnToday: number;

    /**
     * The number of due cards that should be reviewed now in this deck.
     */
    shouldReviewToday: number;

    /**
     * The number of cards currently in the learning queue.
     */
    learning: number;

    /**
     * The number of cards currently in the relearning queue.
     */
    relearning: number;

    /**
     * The number of new cards learned today in this deck.
     * If the card don't already step into review stage, it wouldn't be counted.
     */
    newLearnedToday: number;

    /**
     * The number of learning card actions today.
     */
    learnedToday: number;

    /**
     * The number of cards reviewed today in this deck.
     */
    reviewedToday: number;
}

export type DeckCreationResult =
    | { state: "success" }
    | { state: "duplicate" }
    | { state: "error"; errorMessage: string };
