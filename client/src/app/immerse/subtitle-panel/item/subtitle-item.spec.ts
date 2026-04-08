import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SubtitleItemComponent } from "./subtitle-item";
import { TranslateModule } from "@ngx-translate/core";
import { SubtitleService } from "@render/immerse/subtitle-service";

describe("SubtitleItemComponent", () => {
    let component: SubtitleItemComponent;
    let fixture: ComponentFixture<SubtitleItemComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                SubtitleItemComponent,
                TranslateModule.forRoot()
            ],
            providers: [
                SubtitleService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(SubtitleItemComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
