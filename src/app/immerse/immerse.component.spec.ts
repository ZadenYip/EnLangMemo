import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import {TranslateModule} from '@ngx-translate/core';
import {provideRouter} from '@angular/router';
import { ImmerseComponent } from './immerse.component';

describe('ImmerseComponent', () => {
    let component: ImmerseComponent;
    let fixture: ComponentFixture<ImmerseComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [ImmerseComponent, TranslateModule.forRoot()],
            providers: [provideRouter([])]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ImmerseComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});