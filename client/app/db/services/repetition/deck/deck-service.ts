import { getRepDb } from "@main/db/db";
import { decksTable } from "@main/db/schema/repetition/rep";
import { Deck, DeckConfig, DeckCreationResult } from "./deck-service-types";
import { eq } from "drizzle-orm";
import { generateUUIDV7 } from "@main/db/import/utils";
import Logger from "electron-log";

export class DeckService {
    /**
     * 获取当前 collection 下的所有牌组，并转换为前端需要的 Deck 模型。
     */
    async listDecks(): Promise<Deck[]> {
        const deckRows = await getRepDb().query.decksTable.findMany({
            columns: {
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
                isSuccess: false,
                errorMessage: "A deck with the same name already exists.",
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
            isSuccess: true,
            errorMessage: ""
        }
        return result;
    }

    /**
     * 
     * @param deckName - deleting deck name
     * 
     */
    async deleteDeck(deckName: string): Promise<void> {
        Logger.info("Deleting deck with name:", deckName);
        await getRepDb().delete(decksTable).where(eq(decksTable.name, deckName));
        Logger.info("Deck deleted successfully:", deckName);
        return;
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
