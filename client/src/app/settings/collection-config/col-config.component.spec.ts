import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CollectionConfigComponent } from "./col-config.component";

describe("CollectionConfigComponent", () => {
    let component: CollectionConfigComponent;
    let fixture: ComponentFixture<CollectionConfigComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CollectionConfigComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(CollectionConfigComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
