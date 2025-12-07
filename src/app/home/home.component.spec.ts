import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import {HomeComponent} from './home.component';
import {TranslateModule} from '@ngx-translate/core';
import {provideRouter} from '@angular/router';

describe('HomeComponent', () => {
    let component: HomeComponent;
    let fixture: ComponentFixture<HomeComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [HomeComponent, TranslateModule.forRoot()],
            providers: [provideRouter([])]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(HomeComponent);
        component = fixture.componentInstance;
        // fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});