import { Deck, DeckConfig, DeckCreationResult } from "./deck-service-types";
import { IDeckService } from "./deck-service-interface";
import { DeckService } from "./deck-service";

/**
 * IPC-facing deck service facade.
 */
export class DeckIpcService implements IDeckService {
    /**
     * Internal deck business service.
     */
    private readonly deckService = new DeckService();

    /**
     * List all decks in the current collection.
     */
    listDecks(): Promise<Deck[]> {
        return this.deckService.listDecks();
    }

    /**
     * Create a deck by name.
     */
    createDeck(deckName: string): Promise<DeckCreationResult> {
        return this.deckService.createDeck(deckName);
    }

    /**
     * Delete a deck by id.
     */
    deleteDeck(deckId: string): Promise<void> {
        return this.deckService.deleteDeck(deckId);
    }

    /**
     * Get deck config by id.
     */
    getDeckConfig(deckId: string): Promise<DeckConfig> {
        return this.deckService.getDeckConfig(deckId);
    }

    /**
     * Update deck config by id.
     */
    updateDeckConfig(deckId: string, config: DeckConfig): Promise<void> {
        return this.deckService.updateDeckConfig(deckId, config);
    }
}
