/**
 * Deck daily new-card counters needed for new-card limit calculation.
 */
export interface DeckNewCardLimit {
    /**
     * Maximum new cards allowed per day. Negative means unlimited.
     */
    newCardsPerDay: number;
    /**
     * New cards already learned today.
     */
    newLearnedToday: number;
}

/**
 * Calculate how many new cards this deck can still learn today.
 */
export function calcCanLearnToday(deck: DeckNewCardLimit): number {
    if (deck.newCardsPerDay < 0) {
        return -1;
    }
    return Math.max(0, deck.newCardsPerDay - deck.newLearnedToday);
}

/**
 * Clamp the requested new-card query limit by the deck's remaining daily quota.
 */
export function resolveNewCardLimit(deck: DeckNewCardLimit, requestedLimit: number): number {
    const canLearnToday = calcCanLearnToday(deck);
    if (canLearnToday < 0) {
        return requestedLimit;
    }
    return Math.min(requestedLimit, canLearnToday);
}
