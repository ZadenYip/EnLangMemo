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
     * Called after a file is selected.
     * @param event - File selection event
     */
    onVideoSelected(event: Event): void {
        const handler = (file: File) => {
            console.log('Selected video file:', file);
        }
        this.videoSrc = this.getURLFromInputElem(event, this.videoSrc, handler);
    }

    onSubtitleSelected(event: Event): void {
        const handler = (file: File) => {
            console.log('Selected subtitle file:', file);
            this.loadSubtitleFile(file);
        };
        this.subtitleSrc = this.getURLFromInputElem(event, this.subtitleSrc, handler);
    }

    private loadSubtitleFile(file: File): void {
        const filePath = window.electron.webUtils.getPathForFile(file);
        window.observables.subtitleService.fetchSubtitles$(filePath).subscribe({
            next: (cue) => {
                console.log('Received subtitle cue:', cue);
            },
            error: (err) => {
                console.error('Error fetching subtitles:', err);
            },
            complete: () => {
                console.log('Completed fetching subtitles.');
            },
        });
    }

    /**
     * Creates an object URL from the selected file and revokes the previous one.
     * @param event - File selection event
     * @param safeUrl - Previous SafeUrl to revoke
     * @param handle - Optional handler for the selected file
     * @returns - New SafeUrl for the selected file
     */
    getURLFromInputElem(event: Event, safeUrl: SafeUrl, handle?: (file: File) => void): SafeUrl {
        const input = event.target as HTMLInputElement;

        // Ensure a file is selected
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
     * Called when video metadata is loaded.
     */
    onVideoLoaded(): void {
        // Use setTimeout to ensure video.src is fully updated
        setTimeout(() => {
            this.videoPlayer().nativeElement.play();
            log.info('Video playback started.');
        }, 0);
    }

    onVideoPlaying(event: Event): void {
        const currentTimeInSeconds = this.videoPlayer().nativeElement.currentTime;
        log.debug('Current video time:', currentTimeInSeconds);
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
