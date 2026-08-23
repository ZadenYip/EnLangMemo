import { FSRS, fsrs, FSRSParameters, Grade } from "ts-fsrs";
import { ColConfig } from "../collection/col-service-types.js";
import { repeatHandler, toCard } from "./card-service-helper.js";
import { CardRating, CardReviewRating, FSRSCard, StudyCardRatingPreviews } from "./card-service-types.js";

interface CachedFsrsScheduler {
    /**
     * Deck id in hex string format for the cached scheduler.
     */
    deckId: string;
    /**
     * Reusable FSRS scheduler instance for the current deck and parameters.
     */
    scheduler: FSRS;
}

/** FSRS scheduler cache reused across card reviews in the main process. */
let cachedFsrsScheduler: CachedFsrsScheduler | null = null;

/**
 * Clear the cached FSRS scheduler for one deck or for all decks.
 */
export function clearFsrsSchedulerCache(): void {
    cachedFsrsScheduler = null;
}

/**
 * Get the reusable FSRS scheduler for one deck.
 */
export function getFsrsScheduler(deckId: string, fsrsParams: Partial<FSRSParameters>): FSRS {
    if (!cachedFsrsScheduler || cachedFsrsScheduler.deckId !== deckId) {
        cachedFsrsScheduler = {
            deckId,
            scheduler: fsrs(fsrsParams),
        };
    }

    return cachedFsrsScheduler.scheduler;
}

/**
 * Build all FSRS rating previews for one study card.
 */
export function buildRatingPreviews(card: FSRSCard, collectionConfig: ColConfig, scheduler: FSRS): StudyCardRatingPreviews {
    const previewTime = new Date();
    const preview = scheduler.repeat(toCard(card, collectionConfig), previewTime, repeatHandler);

    return {
        [CardRating.AGAIN]: ratingPreview(preview[CardRating.AGAIN].card, previewTime),
        [CardRating.HARD]: ratingPreview(preview[CardRating.HARD].card, previewTime),
        [CardRating.GOOD]: ratingPreview(preview[CardRating.GOOD].card, previewTime),
        [CardRating.EASY]: ratingPreview(preview[CardRating.EASY].card, previewTime),
    };
}

/**
 * Convert the IPC-safe rating value to the FSRS grade expected by the scheduler.
 */
export function toFsrsGrade(rating: CardReviewRating): Grade {
    return rating as unknown as Grade;
}

/**
 * Convert one FSRS preview card into the renderer-facing interval preview.
 */
function ratingPreview(card: FSRSCard, previewTime: Date): StudyCardRatingPreviews[CardReviewRating] {
    return {
        due: card.due,
        intervalMs: Math.max(0, card.due.getTime() - previewTime.getTime()),
    };
}
