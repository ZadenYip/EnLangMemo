import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoComponent } from './video-component';
import { TranslateModule } from '@ngx-translate/core';
import { SubtitleService } from '../subtitle-service';

describe('VideoComponentComponent', () => {
  let component: VideoComponent;
  let fixture: ComponentFixture<VideoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        VideoComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        SubtitleService
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
