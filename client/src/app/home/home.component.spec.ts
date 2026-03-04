import { ComponentFixture, TestBed } from '@angular/core/testing';

import {HomeComponent} from './home.component';
import {TranslateModule} from '@ngx-translate/core';
import {provideRouter} from '@angular/router';

describe('HomeComponent', () => {
    let component: HomeComponent;
    let fixture: ComponentFixture<HomeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HomeComponent, TranslateModule.forRoot()],
            providers: [provideRouter([])]
        }).compileComponents();
    });

    beforeEach(async () => {
        fixture = TestBed.createComponent(HomeComponent);
        component = fixture.componentInstance;
        // await fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
