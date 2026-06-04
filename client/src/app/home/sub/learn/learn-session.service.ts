import { computed, Injectable, signal } from "@angular/core";
import Logger from "electron-log";
import { Deck } from "@main/db/services/repetition/deck/deck-service-types";

import {
    CardQueue,
    CardReviewRating,
    CardReviewResult,
    CardState,
    ReviewedCardState,
    StudyCard,
    StudyCardRatingPreviews,
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

    /** Current study queue counters derived from the deck overview. */
    readonly queueCounts = computed<{ new: number; learning: number; review: number }>(() => {
        const deck = this.deck();
        if (!deck) {
            return {
                new: 0,
                learning: 0,
                review: 0,
            };
        }

        return {
            new: deck.canLearnToday < 0
                // unlimited
                ? deck.newCards 
                : Math.min(deck.canLearnToday, deck.newCards),
            learning: deck.learning + deck.relearning,
            review: deck.shouldReviewToday,
        };
    });

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
        const nextReviewDayStart = await window.service.card.getNextReviewDayStart();
        const result = await window.service.card.reviewCard(sourceCard.cardId, rating, duration);
        this.applyCardReviewResult(sourceCard, result, nextReviewDayStart);
        return result;
    }

    /** Clear cached FSRS scheduler state for the active learning session. */
    clearSchedulerCache(): Promise<void> {
        return window.service.card.clearFsrsSchedulerCache();
    }

    /** Load FSRS rating previews for one study card through the card IPC service. */
    getRatingPreviews(studyCard: StudyCard): Promise<StudyCardRatingPreviews | null> {
        return window.service.card.getStudyCardRatingPreviews(studyCard.cardId);
    }

    /** Apply one successful card review result to the local deck overview counters. */
    private applyCardReviewResult(srcCard: StudyCard, result: CardReviewResult, nextReviewDayStart: number): void {
        if (result.state !== "success") {
            return;
        }

        const deck = this.deck();
        if (!deck) {
            return;
        }

        const nextDeck = { ...deck };
        this.applyReviewedCardStatsTransition(nextDeck, srcCard, result.card, nextReviewDayStart);
        this.deck.set(nextDeck);
    }

    /** Apply deck counter changes caused by one card review transition. */
    private applyReviewedCardStatsTransition(
        deck: Deck,
        srcCard: StudyCard,
        resultCard: ReviewedCardState,
        nextReviewDayStart: number,
    ): void {
        this.rmSourceCardStats(deck, srcCard);
        this.addResultCardStats(deck, resultCard, nextReviewDayStart);
    }

    /** Remove the source card from the deck counters it occupied before review. */
    private rmSourceCardStats(deck: Deck, srcCard: StudyCard): void {
        if (srcCard.queue === CardQueue.NEW) {
            deck.newCards = this.decrementCounter(deck.newCards);
            deck.canLearnToday = this.decrementCounter(deck.canLearnToday);
            deck.newLearnedToday += 1;
            deck.learnedToday += 1;
            return;
        }

        if (srcCard.queue === CardQueue.LEARNING) {
            if (srcCard.card.state === CardState.RELEARNING) {
                deck.relearning = this.decrementCounter(deck.relearning);
            } else {
                // NEW LEARNING
                deck.learning = this.decrementCounter(deck.learning);
            }
            deck.learnedToday += 1;
            return;
        }

        if (srcCard.queue === CardQueue.REVIEW) {
            deck.shouldReviewToday = this.decrementCounter(deck.shouldReviewToday);
            deck.reviewedToday += 1;
        }
    }

    /** Add the reviewed card to the deck counters it occupies after review. */
    private addResultCardStats(deck: Deck, resultCard: ReviewedCardState, nextReviewDayStart: number): void {
        if (resultCard.queue === CardQueue.NEW) {
            Logger.error("Card is still in new queue after review, which shouldn't happen", {
                cardId: resultCard.cardId,
            });
            return;
        }


        if (resultCard.queue === CardQueue.LEARNING) {
            if (resultCard.state === CardState.RELEARNING) {
                deck.relearning += 1;
            } else {
                // NEW LEARNING
                deck.learning += 1;
            }
            return;
        }

        if (resultCard.queue === CardQueue.REVIEW && resultCard.due <= nextReviewDayStart) {
            deck.shouldReviewToday += 1;
        }
    }

    /** Decrease one local deck counter without allowing negative display values. */
    private decrementCounter(value: number): number {
        return Math.max(0, value - 1);
    }
}
