import { ProxyPropertyType } from "electron-ipc-cat/common";
import { Deck, DeckCreationResult } from "./deck-service-types";

export interface IDeckService {
    listDecks(): Promise<Deck[]>;
    createDeck(deckName: string): Promise<DeckCreationResult>;
    deleteDeck(deckName: string): Promise<void>;
}

export const DeckServiceIPCDescriptor = {
    channel: "deckService",
    properties: {
        listDecks: ProxyPropertyType.Function,
        createDeck: ProxyPropertyType.Function,
        deleteDeck: ProxyPropertyType.Function,
    },
};
