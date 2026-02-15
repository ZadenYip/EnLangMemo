import { firstValueFrom } from 'rxjs';
import { HomeService } from './home.service';
import { TestBed } from '@angular/core/testing';
import { Mock } from 'vitest';

const MOCK_RAW_DECKS = [
    {
        deck_id: 1,
        name: 'Deck 1',
        new_cards_per_day: 10,
        new_cards_learned: 50,
    },
    { 
        deck_id: 2, 
        name: 'Deck 2', 
        new_cards_per_day: 5, 
        new_cards_learned: 20 
    },
];

describe('HomeService (Renderer Unit Test)', () => {
    let service: HomeService;
    let ipcRunSQLMock: Mock = vi.spyOn(window.service.database, 'runSQL');

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [HomeService] });
        service = TestBed.inject(HomeService);
    });

    afterEach(() => {
        ipcRunSQLMock.mockReset();
    });

    it('should create the service', () => {
        expect(service).toBeTruthy();
    });

    it('should query and correctly map the deck list from a mocked IPC call', async () => {
        // Tell the mocked ipcRunSQL what fake data we want it to return when called
        // Corresponds to the ipcRunSQL call inside service.queryDeckList()
       ipcRunSQLMock.mockResolvedValue(MOCK_RAW_DECKS);
        const decks = await firstValueFrom(service.queryDeckList());

        expect(ipcRunSQLMock).toHaveBeenCalledTimes(1);

        expect(decks.length).toBe(MOCK_RAW_DECKS.length);
        expect(decks[0].deckId).toBe(MOCK_RAW_DECKS[0].deck_id);
        expect(decks[0].name).toBe(MOCK_RAW_DECKS[0].name);
        expect(decks[0].newCardsLearned).toBe(MOCK_RAW_DECKS[0].new_cards_learned);
        expect(decks[0].newCardsPerDay).toBe(MOCK_RAW_DECKS[0].new_cards_per_day);
        expect(decks[1].deckId).toBe(MOCK_RAW_DECKS[1].deck_id);
        expect(decks[1].name).toBe(MOCK_RAW_DECKS[1].name);
        expect(decks[1].newCardsPerDay).toBe(MOCK_RAW_DECKS[1].new_cards_per_day);
        expect(decks[1].newCardsLearned).toBe(MOCK_RAW_DECKS[1].new_cards_learned);
    });

    it('should handle an empty response from the main process', async () => {
        ipcRunSQLMock.mockResolvedValue([]);
        const decks = await firstValueFrom(service.queryDeckList());

        expect(ipcRunSQLMock).toHaveBeenCalledTimes(1);
        expect(decks).toEqual([]); // Expect an empty array
    });
});
