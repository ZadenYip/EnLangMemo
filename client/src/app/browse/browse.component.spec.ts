import { ComponentFixture, TestBed } from "@angular/core/testing";

import { BrowseComponent } from "./browse.component";
import { SidenavComponent } from "@render/shared/sidenav/sidenav-layout";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";

describe("BrowseComponent", () => {
    let component: BrowseComponent;
    let fixture: ComponentFixture<BrowseComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                BrowseComponent,
                SidenavComponent,
                TranslateModule.forRoot()
            ],
            providers: [provideRouter([])]

        }).compileComponents();

        fixture = TestBed.createComponent(BrowseComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
