import { Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { DeckListItem } from '../deck-list-item.model';
import Database from 'better-sqlite3';
import Logger from 'electron-log';

@Injectable({
    providedIn: 'root',
})
export class HomeService {

    public queryDeckList(): Observable<DeckListItem[]> {
        const sql = `
            SELECT deck_id, name, new_cards_per_day, new_cards_learned FROM decks
        `;

        return from(window.service.database.runSQL(sql)).pipe(
            map((rawDecks: any[] | Database.RunResult) => {
                rawDecks = rawDecks as any[];
                const deckList: DeckListItem[] = rawDecks.map((item) => ({
                    deckId: item.deck_id,
                    name: item.name,
                    newCardsPerDay: item.new_cards_per_day,
                    newCardsLearned: item.new_cards_learned,
                }));
                Logger.info('Mapped deck list:', deckList);
                return deckList;
            })
        );
    }
}
