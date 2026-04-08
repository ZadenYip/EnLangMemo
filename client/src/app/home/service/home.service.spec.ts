import { HomeService } from "./home.service";
import { TestBed } from "@angular/core/testing";


describe("HomeService (Renderer Unit Test)", () => {
    let service: HomeService;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [HomeService] });
        service = TestBed.inject(HomeService);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("should create the service", () => {
        expect(service).toBeTruthy();
    });

});
