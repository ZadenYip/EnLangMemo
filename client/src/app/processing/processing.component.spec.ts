import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ProcessingComponent } from "./processing.component";
import { TranslateModule } from "@ngx-translate/core";

describe("ProcessingComponent", () => {
    let component: ProcessingComponent;
    let fixture: ComponentFixture<ProcessingComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                ProcessingComponent,
                TranslateModule.forRoot(),
            ],
        }).compileComponents();
    });
    
    it("should create", () => {
        fixture = TestBed.createComponent(ProcessingComponent);
        component = fixture.componentInstance;
        expect(component).toBeTruthy();
    });
});
