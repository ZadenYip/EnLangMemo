import { getRepDb } from "@main/db/db";
import { decksTable } from "@main/db/schema/repetition/rep";
import { Deck, DeckConfig, DeckCreationResult } from "./deck-service-types";
import { eq } from "drizzle-orm";
import { bufferToHex, generateUUIDV7, hexToBuffer } from "@main/db/import/utils";
import Logger from "electron-log";

export class DeckService {
    /**
     * get all decks in current collection and transform them to Deck model needed by frontend.
     */
    async listDecks(): Promise<Deck[]> {
        const deckRows = await getRepDb().query.decksTable.findMany({
            columns: {
                id: true,
                name: true,
                learnedToday: true,
                reviewedToday: true,
            }
        })

        return deckRows.map((deckRow) => {
            // TODO: 实现今日可学新卡数量计算逻辑。
            const canLearnToday = this.calcCanLearnToday(deckRow.name);
            // TODO: 实现今日可复习数量计算逻辑。
            const canReviewToday = this.calcCanReviewToday(deckRow.name);

            const deck: Deck = {
                id: bufferToHex(deckRow.id),
                name: deckRow.name,
                canLearnToday,
                canReviewToday,
                learnedToday: deckRow.learnedToday,
                reviewedToday: deckRow.reviewedToday,
            };
            return deck;
        });
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
     * Get deck config by deck id.
     * @param deckId - target deck id
     */
    async getDeckConfig(deckId: string): Promise<DeckConfig> {
        Logger.info("Getting deck config for deck:", deckId);
        const deckRow = await getRepDb().query.decksTable.findFirst({
            where: eq(decksTable.id, hexToBuffer(deckId)),
            columns: {
                config: true,
            },
        });
        
        if (!deckRow) {
            Logger.error("Deck not found when getting config:", deckId);
            throw new Error(`Deck with id "${deckId}" not found.`);
        }

        Logger.info("Deck config retrieved:", {
            deckId,
            config: deckRow.config,
        });

        return deckRow.config;
    }

    /**
     * Update deck config by deck id.
     * @param deckId - target deck id
     * @param config - updated config
     */
    async updateDeckConfig(deckId: string, config: DeckConfig): Promise<void> {
        Logger.info("Updating deck config:", deckId);
        await getRepDb()
            .update(decksTable)
            .set({
                config,
                updatedAt: Date.now(),
            })
            .where(eq(decksTable.id, hexToBuffer(deckId)));
        Logger.info("Deck config updated successfully:", deckId);
        Logger.info("Updated config:", config);
    }

    private generateDeckConfig(): DeckConfig {
        const defaultConfig: DeckConfig = {
            newCardsPerDay: 20,
            // TODO: 在此设置 FSRS 算法相关参数的默认值。
        };
        return defaultConfig;
    }

    private calcCanLearnToday(_deckName: string): number {
        // TODO: 在此实现 canLearnToday 的真实计算。
        return 0;
    }

    private calcCanReviewToday(_deckName: string): number {
        // TODO: 在此实现 canReviewToday 的真实计算。
        return 0;
    }
}
