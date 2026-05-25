import { computed, Injectable, signal } from "@angular/core";
import Logger from "electron-log";
import { Deck } from "@main/db/services/repetition/deck/deck-service-types";

@Injectable()
export class LearnStateService {
    /** Deck overview loaded for the current learning route. */
    readonly deck = signal<Deck | null>(null);

    /** Whether the deck overview is still loading. */
    readonly isLoading = signal(true);

    /** Whether loading failed because the deck service threw an error. */
    readonly loadFailed = signal(false);

    /** Whether the deck has no learning work left by the current deck counters. */
    readonly isDeckCompleted = computed(() => {
        const deck = this.deck();
        if (!deck) {
            return false;
        }

        const newCardsBlockedByLimit = deck.canLearnToday === 0;
        const noNewCardWork = deck.newCards === 0 || newCardsBlockedByLimit;
        return deck.learning === 0 && deck.relearning === 0 && noNewCardWork;
    });

    /** Load target deck overview through the IPC deck service. */
    async loadDeck(deckId: string): Promise<void> {
        this.isLoading.set(true);
        this.loadFailed.set(false);

        try {
            const deck = await window.service.deck.getDeckById(deckId);
            this.deck.set(deck);
            Logger.info("Successfully loaded deck for learning route", {
                deckId
            });
        } catch (error) {
            Logger.error("Failed to load deck for learning route", {
                deckId,
                error,
            });
            this.deck.set(null);
            this.loadFailed.set(true);
            Logger.error(`Failed to load deck: ${deckId} for learning`, {
                deckId,
                error,
            });
        } finally {
            this.isLoading.set(false);
        }
    }
}
