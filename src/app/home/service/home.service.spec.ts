import { firstValueFrom } from 'rxjs';
import { ipcRunSQL } from '../../core/ipc';
import { HomeService } from './home.service';
import { TestBed } from '@angular/core/testing';
import { db } from '../../../setup-jest';

jest.mock('../../core/ipc', () => ({
    ipcRunSQL: jest.fn(),
}));

const MOCK_RAW_DECKS = [
    {
        deck_id: 1,
        name: 'Deck 1',
        new_cards_per_day: 10,
        new_cards_learned: 50,
    },
    { deck_id: 2, name: 'Deck 2', new_cards_per_day: 5, new_cards_learned: 20 },
    {
        deck_id: 3,
        name: 'Deck 3',
        new_cards_per_day: 15,
        new_cards_learned: 75,
    },
];

describe('DatabaseService', () => {
    let service: HomeService;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [HomeService] });
        service = TestBed.inject(HomeService);
    });

    it('should create the service', () => {
        expect(service).toBeTruthy();
    });

    it('should query and map the deck list correctly', async () => {
        const stmt = db!.prepare(`
            INSERT INTO decks (deck_id, name, new_cards_per_day, new_cards_learned) VALUES (?, ?, ?, ?)
        `);
        MOCK_RAW_DECKS.forEach((deck) => {
            stmt.run(
                deck.deck_id,
                deck.name,
                deck.new_cards_per_day,
                deck.new_cards_learned
            );
        });

        (ipcRunSQL as jest.Mock).mockImplementationOnce(
            (sql: string, params: any[] = []) => {
                const stmt = db!.prepare(sql);
                const result: any[] = stmt.all(...params);
                return Promise.resolve(result);
            }
        );

        const decks = await firstValueFrom(service.queryDeckList().pipe());
        expect(decks.length).toBe(MOCK_RAW_DECKS.length);
        decks.forEach((deck, index) => {
            expect(deck.deckId).toBe(MOCK_RAW_DECKS[index].deck_id);
            expect(deck.name).toBe(MOCK_RAW_DECKS[index].name);
            expect(deck.newCardsPerDay).toBe(
                MOCK_RAW_DECKS[index].new_cards_per_day
            );
            expect(deck.newCardsLearned).toBe(
                MOCK_RAW_DECKS[index].new_cards_learned
            );
        });
    });
});
