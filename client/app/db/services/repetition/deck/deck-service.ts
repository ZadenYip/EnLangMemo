import { getRepDb } from "@main/db/db";
import { decksTable } from "@main/db/schema/repetition/rep";
import { Deck, DeckConfig, DeckCreationResult, DeckSettings } from "./deck-service-types";
import { eq } from "drizzle-orm";
import { bufferToHex, generateUUIDV7, hexToBuffer } from "@main/db/import/utils";
import Logger from "electron-log";
import { generatorParameters } from "ts-fsrs";
import { countCardsByDeckAndQueues } from "../cards/card-service";
import { CARD_QUEUE } from "../cards/card-service-types";

export class DeckService {
    /**
     * get all decks in current collection and transform them to Deck model needed by frontend.
     */
    async listDecks(): Promise<Deck[]> {
        const deckRows = await getRepDb().query.decksTable.findMany({
            columns: {
                id: true,
                name: true,
                newCardsPerDay: true,
                newLearnedToday: true,
                learnedToday: true,
                reviewedToday: true,
            }
        })

        return Promise.all(deckRows.map(async (deckRow) => {
            const canLearnToday = this.calcCanLearnToday(deckRow);
            const [newCards, shouldReviewToday, learning, relearning] = await Promise.all([
                countCardsByDeckAndQueues(deckRow.id, [CARD_QUEUE.NEW]),
                countCardsByDeckAndQueues(deckRow.id, [CARD_QUEUE.REVIEW], new Date()),
                countCardsByDeckAndQueues(deckRow.id, [CARD_QUEUE.LEARNING]),
                countCardsByDeckAndQueues(deckRow.id, [CARD_QUEUE.RELEARNING]),
            ]);

            const deck: Deck = {
                id: bufferToHex(deckRow.id),
                name: deckRow.name,
                newCardsPerDay: deckRow.newCardsPerDay,
                canLearnToday,
                newCards,
                shouldReviewToday,
                learning,
                relearning,
                newLearnedToday: deckRow.newLearnedToday,
                learnedToday: deckRow.learnedToday,
                reviewedToday: deckRow.reviewedToday,
            };
            return deck;
        }));
    }

    /**
     * @param deckName - creating deck name
     * @returns creation result
     */
    async createDeck(deckName: string): Promise<DeckCreationResult> {
        const response = await getRepDb().query.decksTable.findFirst({
            where: eq(decksTable.name, deckName),
        });

        if (response) {
            const result: DeckCreationResult = {
                state: "duplicate",
            }
            return result;
        }

        Logger.info("Creating new deck with name:", deckName);
        await getRepDb().insert(decksTable).values({
            id: generateUUIDV7(),
            usn: -1,
            name: deckName,
            updatedAt: Date.now(),
            newCardsPerDay: 20,
            newLearnedToday: 0,
            learnedToday: 0,
            reviewedToday: 0,
            config: this.generateDeckConfig(),
        });
        Logger.info("Deck created successfully:", deckName);

        const result: DeckCreationResult = {
            state: "success",
        }
        return result;
    }

    /**
     * 
     * @param deckId - deleting deck id
     * 
     */
    async deleteDeck(deckId: string): Promise<void> {
        Logger.info("Deleting deck with id:", deckId);
        await getRepDb().delete(decksTable).where(eq(decksTable.id, hexToBuffer(deckId)));
        Logger.info("Deck deleted successfully:", deckId);
        return;
    }

    /**
     * Get deck editable settings by deck id.
     * @param deckId - target deck id
     */
    async getDeckSettings(deckId: string): Promise<DeckSettings> {
        Logger.info("Getting deck settings for deck:", deckId);
        const deckRow = await getRepDb().query.decksTable.findFirst({
            where: eq(decksTable.id, hexToBuffer(deckId)),
            columns: {
                newCardsPerDay: true,
                config: true,
            },
        });
        
        if (!deckRow) {
            Logger.error("Deck not found when getting settings:", deckId);
            throw new Error(`Deck with id "${deckId}" not found.`);
        }

        Logger.info("Deck settings retrieved:", {
            deckId,
            settings: {
                ...deckRow.config,
                newCardsPerDay: deckRow.newCardsPerDay,
            },
        });

        return {
            ...deckRow.config,
            newCardsPerDay: deckRow.newCardsPerDay,
        };
    }

    /**
     * Update deck editable settings by deck id.
     * @param deckId - target deck id
     * @param settings - updated settings
     */
    async updateDeckSettings(deckId: string, settings: DeckSettings): Promise<void> {
        Logger.info("Updating deck settings:", deckId);
        const { newCardsPerDay, ...deckConfig } = settings;
        await getRepDb()
            .update(decksTable)
            .set({
                newCardsPerDay,
                config: deckConfig,
                updatedAt: Date.now(),
            })
            .where(eq(decksTable.id, hexToBuffer(deckId)));
        Logger.info("Deck settings updated successfully:", deckId);
        Logger.info("Updated settings:", settings);
    }

    private generateDeckConfig(): DeckConfig {
        const params = generatorParameters();
        const defaultConfig: DeckConfig = {
            fsrsParams: params
        };
        return defaultConfig;
    }

    private calcCanLearnToday(deck: { newCardsPerDay: number; newLearnedToday: number }): number {
        if (deck.newCardsPerDay < 0) {
            return -1;
        }
        return Math.max(0, deck.newCardsPerDay - deck.newLearnedToday);
    }
}
