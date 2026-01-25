import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoComponent } from './video-component.component';
import { TranslateModule } from '@ngx-translate/core';

describe('VideoComponentComponent', () => {
  let component: VideoComponent;
  let fixture: ComponentFixture<VideoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        VideoComponent,
        TranslateModule.forRoot()
      ],
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
