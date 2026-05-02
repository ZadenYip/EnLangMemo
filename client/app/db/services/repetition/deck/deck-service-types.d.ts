
export interface DeckConfig {
    /**
     * The maximum number of new cards can be learned per day in this deck.
     * -1 means no limit
     */
    newCardsPerDay: number;
    // TODO FSRS algorithm parameters
}

export interface Deck {
    name: string;
    /**
     * The number of cards can learn today in this deck.
     */
    canLearnToday: number;
    
    canReviewToday: number;
    
    /**
     * The number of new cards learned today in this deck.
     * If the card don't already step into review stage, it wouldn't be counted.
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
    | { state: "error"; errorMessage: string }
