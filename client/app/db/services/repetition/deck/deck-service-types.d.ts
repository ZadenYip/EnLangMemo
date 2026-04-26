
export interface DeckConfig {
    /**
     * The maximum number of new cards can be learned per day in this deck.
     * -1 means no limit
     */
    newCardsPerDay: number;
    // TODO FSRS algorithm parameters
}