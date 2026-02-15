import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubtitlePanelComponent } from './subtitle-panel';
import { TranslateModule } from '@ngx-translate/core';
import { SubtitleService } from '../subtitle-service';

describe('SubtitlePanelComponent', () => {
  let component: SubtitlePanelComponent;
  let fixture: ComponentFixture<SubtitlePanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ 
        SubtitlePanelComponent,
        TranslateModule.forRoot()
       ],
       providers: [
        SubtitleService
       ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubtitlePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
