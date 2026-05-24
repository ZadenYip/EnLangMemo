import { ProxyPropertyType } from "electron-ipc-cat/common";
import { Deck, DeckCreationResult, DeckSettings } from "./deck-service-types";

export interface IDeckService {
    listDecks(): Promise<Deck[]>;
    createDeck(deckName: string): Promise<DeckCreationResult>;
    deleteDeck(deckId: string): Promise<void>;
    getDeckSettings(deckId: string): Promise<DeckSettings>;
    updateDeckSettings(deckId: string, settings: DeckSettings): Promise<void>;
}

export const DeckServiceIPCDescriptor = {
    channel: "deckService",
    properties: {
        listDecks: ProxyPropertyType.Function,
        createDeck: ProxyPropertyType.Function,
        deleteDeck: ProxyPropertyType.Function,
        getDeckSettings: ProxyPropertyType.Function,
        updateDeckSettings: ProxyPropertyType.Function,
    },
};
