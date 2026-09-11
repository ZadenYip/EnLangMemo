import { ICardService } from "./card-service-interface.js";
import { clearFsrsSchedulerCache, getStudyCardRatingPreviews, getStudyCards, reviewCard } from "./card-service.js";
import { CardReviewRating, CardReviewResult, StudyCard, StudyCardRatingPreviews } from "./card-service-types.js";
import { getNextReviewDayStart, getTimeConfig } from "../shared/time.js";

/**
 * IPC-facing card service facade.
 */
export class CardIpcService implements ICardService {
    /**
     * Get the next study cards for one deck.
     */
    getStudyCards(deckId: string, limit: number): Promise<StudyCard[]> {
        return getStudyCards(deckId, limit);
    }

    /**
     * Get the next review-day start timestamp for the current collection.
     */
    getNextReviewDayStart(): Promise<number> {
        const timeConfig = getTimeConfig();
        const nextReviewDayStart = getNextReviewDayStart(timeConfig);
        return Promise.resolve(nextReviewDayStart);
    }

    /**
     * Get the four FSRS rating previews for one study card.
     */
    getStudyCardRatingPreviews(cardId: string): Promise<StudyCardRatingPreviews | null> {
        return getStudyCardRatingPreviews(cardId);
    }

    /**
     * Review one card and persist its FSRS scheduling result.
     */
    reviewCard(cardId: string, rating: CardReviewRating, duration: number): Promise<CardReviewResult> {
        return reviewCard(cardId, rating, duration);
    }

    /**
     * Clear the cached FSRS scheduler for the current main-process card service.
     */
    clearFsrsSchedulerCache(): Promise<void> {
        clearFsrsSchedulerCache();
        return Promise.resolve();
    }
}
