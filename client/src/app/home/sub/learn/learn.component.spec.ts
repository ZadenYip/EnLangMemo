import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";

import { LearnComponent } from "./learn.component";

describe("LearnComponent", () => {
    let component: LearnComponent;
    let fixture: ComponentFixture<LearnComponent>;

    beforeEach(async () => {
        const originalService = window.service ?? {};
        (window as typeof window & { service: typeof window.service }).service = {
            ...originalService,
            deck: {
                ...originalService.deck,
                listDecks: async () => [],
            },
        };

        await TestBed.configureTestingModule({
            imports: [
                LearnComponent,
                TranslateModule.forRoot(),
            ],
            providers: [
                provideRouter([]),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(LearnComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
