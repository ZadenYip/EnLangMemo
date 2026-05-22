import { ProxyPropertyType } from "electron-ipc-cat/common";
import { Deck, DeckConfig, DeckCreationResult } from "./deck-service-types";

export interface IDeckService {
    listDecks(): Promise<Deck[]>;
    createDeck(deckName: string): Promise<DeckCreationResult>;
    deleteDeck(deckId: string): Promise<void>;
    getDeckConfig(deckId: string): Promise<DeckConfig>;
    updateDeckConfig(deckId: string, config: DeckConfig): Promise<void>;
}

export const DeckServiceIPCDescriptor = {
    channel: "deckService",
    properties: {
        listDecks: ProxyPropertyType.Function,
        createDeck: ProxyPropertyType.Function,
        deleteDeck: ProxyPropertyType.Function,
        getDeckConfig: ProxyPropertyType.Function,
        updateDeckConfig: ProxyPropertyType.Function,
    },
};
