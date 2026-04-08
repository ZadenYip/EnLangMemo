import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DicImportComponent } from "./dic-import.component";
import { TranslateModule } from "@ngx-translate/core";

describe("DicImportComponent", () => {
    let component: DicImportComponent;
    let fixture: ComponentFixture<DicImportComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                DicImportComponent,
                TranslateModule.forRoot()
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(DicImportComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
