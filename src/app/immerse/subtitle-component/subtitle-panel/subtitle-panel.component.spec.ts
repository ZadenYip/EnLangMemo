import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubtitlePanelComponent } from './subtitle-panel.component';
import { TranslateModule } from '@ngx-translate/core';

describe('SubtitlePanelComponent', () => {
  let component: SubtitlePanelComponent;
  let fixture: ComponentFixture<SubtitlePanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ 
        SubtitlePanelComponent,
        TranslateModule.forRoot()
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
