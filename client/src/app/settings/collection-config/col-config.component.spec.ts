import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CollectionConfigComponent } from "./col-config.component";
import { TranslateModule } from "@ngx-translate/core";

describe("CollectionConfigComponent", () => {
    let component: CollectionConfigComponent;
    let fixture: ComponentFixture<CollectionConfigComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                CollectionConfigComponent,
                TranslateModule.forRoot()
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CollectionConfigComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
