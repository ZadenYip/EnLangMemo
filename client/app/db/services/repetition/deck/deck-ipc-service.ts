import { Deck, DeckCreationResult, DeckSettings } from "./deck-service-types";
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
     * Get one deck overview by id.
     */
    getDeckById(deckId: string): Promise<Deck | null> {
        return this.deckService.getDeckById(deckId);
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
    getDeckSettings(deckId: string): Promise<DeckSettings> {
        return this.deckService.getDeckSettings(deckId);
    }

    /**
     * Update deck config by id.
     */
    updateDeckSettings(deckId: string, settings: DeckSettings): Promise<void> {
        return this.deckService.updateDeckSettings(deckId, settings);
    }
}
