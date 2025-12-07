import {
    Component,
    ElementRef,
    SecurityContext,
    viewChild,
} from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import log from 'electron-log/renderer';
import {
    CdkVirtualScrollViewport,
    ScrollingModule,
} from '@angular/cdk/scrolling';
import { TranslatePipe } from '@ngx-translate/core';
import { parse, resync } from 'subtitle';
import { from, take } from 'rxjs';

export interface BilingualSubtitle {
    id: number;
    startTime: number;
    endTime: number;
    text: string;
}

@Component({
    selector: 'app-immerse',
    templateUrl: './immerse.component.html',
    styleUrls: ['./immerse.component.scss'],
    standalone: true,
    imports: [
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatListModule,
        TranslatePipe,
        ScrollingModule,
        CdkVirtualScrollViewport,
    ],
})
export class ImmerseComponent {
    readonly videoPlayer =
        viewChild.required<ElementRef<HTMLVideoElement>>('videoPlayer');

    videoSrc: SafeUrl = '';
    subtitleSrc: SafeUrl = '';

    constructor(private sanitizer: DomSanitizer) {}

    /**
     * 选择文件后，方法会被调用。
     * @param event - 文件选择事件
     */
    onVideoSelected(event: Event): void {
        this.videoSrc = this.getURLFromInputElem(event, this.videoSrc, (file: File) => {
            console.log('Selected video file:', file);
        });
        this.videoPlayer().nativeElement.volume = 0.5;
    }

    onSubtitleSelected(event: Event): void {
        this.subtitleSrc = this.getURLFromInputElem(event, this.subtitleSrc, (file: File) => {
            console.log('Selected subtitle file:', file);
            this.loadSubtitleFile(file);
        });
    }

    private loadSubtitleFile(file: File): void {
        // TODO IPC 调用 以流形式获取字幕内容 使用ipc sender?
    }

    getURLFromInputElem(event: Event, safeUrl: SafeUrl, handle?: (file: File) => void): SafeUrl {
        const input = event.target as HTMLInputElement;

        // 确保用户确实选择了文件
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            const objectUrl = URL.createObjectURL(file);

            const urlString = this.sanitizer.sanitize(
                SecurityContext.URL,
                safeUrl
            );
            if (urlString !== '') {
                log.info('Revoking previous object URL:', urlString);
                URL.revokeObjectURL(urlString!);
            }

            handle?.(file);

            log.info('Created object URL for file:', objectUrl);
            return this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        }

        return '';
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

    onVideoPlaying(event: Event): void {
        const currentTimeInSeconds = this.videoPlayer().nativeElement.currentTime;
        log.info('Current video time:', currentTimeInSeconds);
        this.updateCurrentSubtitle(currentTimeInSeconds);
    }

    private updateCurrentSubtitle(currentTimeInSeconds: number): void {
        const ms = Math.ceil(currentTimeInSeconds * 1000);

    }

    // TODO 准备用ffmpeg 提取视频里面的ass字幕为srt字幕 或者可手动上传字幕，加载进subtitles
    public subtitles: BilingualSubtitle[] = [
        {
            id: 1,
            startTime: 0,
            endTime: 2.5,
            text: 'This is the first line of the subtitle.',
        },
        {
            id: 2,
            startTime: 2.6,
            endTime: 5.0,
            text: 'This is the current, active subtitle line.',
        }
    ];
}
