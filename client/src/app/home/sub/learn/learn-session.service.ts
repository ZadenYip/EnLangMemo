import { computed, Injectable, signal } from "@angular/core";
import Logger from "electron-log";
import { Deck } from "@main/db/services/repetition/deck/deck-service-types";

import {
    CardQueue,
    CardReviewRating,
    CardReviewResult,
    CardState,
    LangCard,
    StudyCard,
    // eslint-disable-next-line
    // @ts-ignore
} from "@main/db/services/repetition/cards/card-service-types";

@Injectable()
export class LearnSessionService {
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

        const noLearning = deck.learning === 0;
        const noRelearning = deck.relearning === 0;
        const newCardsBlockedByLimit = deck.canLearnToday === 0;
        const noNewCardWork = deck.newCards === 0 || newCardsBlockedByLimit;
        const noReviewWork = deck.shouldReviewToday === 0;
        return noLearning && noRelearning && noNewCardWork && noReviewWork;
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

    /** Review one card through IPC and apply the result to the local deck overview counters. */
    async reviewCard(
        sourceCard: StudyCard,
        rating: CardReviewRating,
        duration: number,
    ): Promise<CardReviewResult> {
        const result = await window.service.card.reviewCard(sourceCard.cardId, rating, duration);
        this.applyCardReviewResult(sourceCard, result);
        return result;
    }

    /** Apply one successful card review result to the local deck overview counters. */
    private applyCardReviewResult(sourceCard: StudyCard, result: CardReviewResult): void {
        if (result.state !== "success") {
            return;
        }

        const deck = this.deck();
        if (!deck) {
            return;
        }

        const nextDeck: Deck = {
            ...deck,
        };
        this.removeSourceCardFromDeckStats(nextDeck, sourceCard);
        this.addResultCardToDeckStats(nextDeck, result.card);
        this.deck.set(nextDeck);
    }

    /** Remove the reviewed card from the deck counter it belonged to before rating. */
    private removeSourceCardFromDeckStats(deck: Deck, sourceCard: StudyCard): void {
        if (sourceCard.queue === CardQueue.NEW) {
            deck.newCards = this.decrementCounter(deck.newCards);
            deck.canLearnToday = this.decrementCounter(deck.canLearnToday);
            deck.newLearnedToday += 1;
            deck.learnedToday += 1;
            return;
        }

        if (sourceCard.queue === CardQueue.REVIEW) {
            deck.shouldReviewToday = this.decrementCounter(deck.shouldReviewToday);
            deck.reviewedToday += 1;
            return;
        }

        if (sourceCard.card.state === CardState.RELEARNING) {
            deck.relearning = this.decrementCounter(deck.relearning);
        } else {
            deck.learning = this.decrementCounter(deck.learning);
        }
        deck.learnedToday += 1;
    }

    /** Add the reviewed card to its next deck counter when it remains available now. */
    private addResultCardToDeckStats(deck: Deck, resultCard: LangCard): void {
        if (resultCard.queue === CardQueue.NEW) {
            deck.newCards += 1;
            return;
        }

        if (resultCard.queue === CardQueue.LEARNING) {
            if (resultCard.state === CardState.RELEARNING) {
                deck.relearning += 1;
            } else {
                deck.learning += 1;
            }
            return;
        }

        if (resultCard.queue === CardQueue.REVIEW && new Date(resultCard.due).getTime() <= Date.now()) {
            deck.shouldReviewToday += 1;
        }
    }

    /** Decrease one local deck counter without allowing negative display values. */
    private decrementCounter(value: number): number {
        return Math.max(0, value - 1);
    }
}
