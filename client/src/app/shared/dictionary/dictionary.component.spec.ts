import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DictionaryComponent } from './dictionary.component';
import { TranslateModule } from '@ngx-translate/core';

describe('DictionaryComponent', () => {
    let component: DictionaryComponent;
    let fixture: ComponentFixture<DictionaryComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                DictionaryComponent,
                TranslateModule.forRoot()
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(DictionaryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
