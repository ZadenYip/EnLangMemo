import { computed, signal } from "@angular/core";
// eslint-disable-next-line
// @ts-ignore
import { StudyCard } from "@main/db/services/repetition/cards/card-service-types";
import Logger from "electron-log/renderer";

export class StudyCardQueue {
    /** Maximum number of study cards kept in the local active queue. */
    private readonly queueLimit = 20;

    /** Remaining-card count that triggers one queue refill attempt. */
    private readonly refillThreshold = 10;

    /** Deck id used to fetch due cards for this learning queue. */
    private readonly deckId: string;

    /** Official study queue consumed by the learning page. */
    readonly activeCards = signal<StudyCard[]>([]);

    /** Temporary queue used only for the latest refill fetch result. */
    private readonly fetchedCards = signal<StudyCard[]>([]);

    /** Whether the latest fetch confirmed there are no more cards to study now. */
    readonly noMoreCards = signal(false);

    /** Current card shown on the learning page. */
    readonly curCard = computed(() => this.activeCards()[0] ?? null);

    constructor(deckId: string) {
        this.deckId = deckId;
    }

    /** Load the initial active queue. */
    async loadInitial(): Promise<void> {
        const cards = await this.fetchStudyCards();
        this.activeCards.set(cards);
        this.fetchedCards.set([]);
        this.noMoreCards.set(cards.length === 0);
    }

    /** Remove the current card from the active queue and refill when the queue is low. */
    async advance(): Promise<void> {
        this.activeCards.update((cards) => cards.slice(1));
        if (this.shouldRefill()) {
            await this.refill();
        }
    }

    /** Whether the active queue should be refilled now. */
    private shouldRefill(): boolean {
        if (this.activeCards().length <= 1) {
            return true;
        }
        return this.activeCards().length === this.refillThreshold;
    }

    /** Fetch cards into the temporary queue, merge non-duplicate cards into the active queue, then clear it. */
    private async refill(): Promise<void> {
        const activeCards = this.activeCards();
        const activeCardIds = new Set(activeCards.map((card) => card.cardId));
        const fetchedCards = await this.fetchStudyCards();
        this.fetchedCards.set(fetchedCards);

        const newCards = this.fetchedCards().filter((card) => !activeCardIds.has(card.cardId));
        this.activeCards.set([
            ...activeCards,
            ...newCards,
        ].slice(0, this.queueLimit));
        this.fetchedCards.set([]);
        this.noMoreCards.set(this.activeCards().length === 0 && newCards.length === 0);
        Logger.info(
            `StudyCardQueue: Refilled with ${newCards.length} new cards, 
            active queue length is now ${this.activeCards().length}.`,
        );
    }

    /** Fetch due study cards for this queue's deck. */
    private fetchStudyCards(): Promise<StudyCard[]> {
        return window.service.card.getStudyCards(this.deckId, this.queueLimit);
    }
}
