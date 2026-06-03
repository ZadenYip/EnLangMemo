import { ProxyPropertyType } from "electron-ipc-cat/common";
import type { CardReviewRating, CardReviewResult, StudyCard, StudyCardRatingPreviews } from "./card-service-types";

export interface ICardService {
    getStudyCards(deckId: string, limit: number): Promise<StudyCard[]>;
    getStudyCardRatingPreviews(cardId: string): Promise<StudyCardRatingPreviews | null>;
    reviewCard(cardId: string, rating: CardReviewRating, duration: number): Promise<CardReviewResult>;
    clearFsrsSchedulerCache(): Promise<void>;
}

export const CardServiceIPCDescriptor = {
    channel: "cardService",
    properties: {
        getStudyCards: ProxyPropertyType.Function,
        getStudyCardRatingPreviews: ProxyPropertyType.Function,
        reviewCard: ProxyPropertyType.Function,
        clearFsrsSchedulerCache: ProxyPropertyType.Function,
    },
};
