import { DeckDB } from "../core/models/deck.db.model";

export type DeckListItem = Pick<DeckDB, 'deckId' | 'name' | 'newCardsPerDay' | 'newCardsLearned'>;