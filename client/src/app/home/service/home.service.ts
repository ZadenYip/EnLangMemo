import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { DeckListItem } from "../deck-list-item.model";

@Injectable({
    providedIn: "root",
})
export class HomeService {

    public queryDeckList(): Observable<DeckListItem[]> {
        // TODO replace with = actual card db service method 
        // return from(window.service.dicService.runSQL(sql)).pipe(
        //     map((rawDecks: any[] | Database.RunResult) => {
        //         rawDecks = rawDecks as any[];
        //         const deckList: DeckListItem[] = rawDecks.map((item) => ({
        //             deckId: item.deck_id,
        //             name: item.name,
        //             newCardsPerDay: item.new_cards_per_day,
        //             newCardsLearned: item.new_cards_learned,
        //         }));
        //         Logger.info("Mapped deck list:", deckList);
        //         return deckList;
        //     })
        // );
        return null as any;
    }
}
