import { Injectable, signal } from "@angular/core";
import { Deck } from "@main/db/services/repetition/deck/deck-service-types";
import Logger from "electron-log/renderer";

@Injectable({
    providedIn: "root",
})
export class DeckService {
    deckOverviewList = signal<Deck[]>([]);

    /**
     * Loads the list of decks for the current collection.
     */
    public async reloadDecks(): Promise<void> {
        try {
            this.deckOverviewList.set(await window.service.deck.listDecks());
        } catch (error) {
            Logger.error("failed to reload decks", error);
            this.deckOverviewList.set([]);
            return;
        }
        Logger.info("decks reloaded", {
            deckOverviewList: this.deckOverviewList,
        });
    }
}