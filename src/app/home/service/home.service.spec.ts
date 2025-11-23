import { ipcRunSQL } from "../../core/ipc";
import { HomeService } from "./home.service";
import { TestBed } from "@angular/core/testing";

jest.mock('../../core/ipc', () => ({
    ipcRunSQL: jest.fn()
}))

const MOCK_RAW_DECKS = [
    { deck_id: 1, name: 'Deck 1', new_cards_per_day: 10, new_cards_learned: 50 },
    { deck_id: 2, name: 'Deck 2', new_cards_per_day: 5, new_cards_learned: 20 },
    { deck_id: 3, name: 'Deck 3', new_cards_per_day: 15, new_cards_learned: 75 },
]

describe('DatabaseService', () => {
    let service: HomeService;

    beforeEach(() => {
        TestBed.configureTestingModule({providers: [HomeService]});
        service = TestBed.inject(HomeService);
    });

    it('should create the service', () => {
        expect(service).toBeTruthy();
    });

    it('should query and map the deck list correctly', (done) => {
        (ipcRunSQL as jest.Mock).mockResolvedValue(Promise.resolve(MOCK_RAW_DECKS));
        service.queryDeckList().subscribe((decks) => {
            expect(decks.length).toBe(MOCK_RAW_DECKS.length);
            done();
        });
    });
        
});