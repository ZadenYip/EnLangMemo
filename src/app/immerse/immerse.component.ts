import { Component, ElementRef, SecurityContext, viewChild } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import log from 'electron-log/renderer';

@Component({
  selector: 'app-immerse',
  templateUrl: './immerse.component.html',
  styleUrls: ['./immerse.component.scss'],
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
})
export class ImmerseComponent {
  readonly videoPlayer = viewChild.required<ElementRef<HTMLVideoElement>>('videoPlayer');

  videoSrc: SafeUrl = '';

  constructor(private sanitizer: DomSanitizer) {}

  /**
   * 选择文件后，方法会被调用。
   * @param event - 文件选择事件
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    // 确保用户确实选择了文件
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      const urlString = this.sanitizer.sanitize(SecurityContext.URL, this.videoSrc);
      if (urlString !== '') {
        log.info('Revoking previous object URL:', urlString);
        URL.revokeObjectURL(urlString!);
      }

      const objectUrl = URL.createObjectURL(file);
      log.info('Created new object URL:', objectUrl);

      // 将这个 URL 标记为可安全用于 video.src
      this.videoSrc = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
    }
  }

  /**
   * 加载完视频后自动播放
   */
  onVideoLoaded(): void {
    
    // 使用 setTimeout 确保 video.src 已经更新完毕
    setTimeout(() => {
      this.videoPlayer().nativeElement.play();
      log.info('Video playback started.');
    }, 0);
  }
}