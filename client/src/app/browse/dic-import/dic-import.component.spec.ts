import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DicImportComponent } from "./dic-import.component";

describe("DicImportComponent", () => {
    let component: DicImportComponent;
    let fixture: ComponentFixture<DicImportComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DicImportComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(DicImportComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
