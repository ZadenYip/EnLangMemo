export interface DeckDB {
    deckId: number;
    name: string;
    newCardsPerDay: number;
    newCardsLearned: number;
    algorithm_parameters: string;
}
/**
 * 
 * CREATE TABLE IF NOT EXISTS decks (
 *   deck_id INTEGER PRIMARY KEY, -- Unix Timestamp when the deck was created
 *  name TEXT NOT NULL,
 *  new_cards_per_day INTEGER DEFAULT 20, -- Allowed number of new cards to learn per day
 *  new_cards_learned INTEGER DEFAULT 0, -- Number of new cards learned
 * algorithm_parameters TEXT -- JSON string of algorithm parameters
 * );
 */