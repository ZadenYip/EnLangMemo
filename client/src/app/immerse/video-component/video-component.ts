import { Component, computed, ElementRef, inject, OnDestroy, viewChild } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';
import { FileService } from '../../shared/services/file.service';
import Logger from 'electron-log/renderer';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SubtitleService } from '../subtitle-service';
import { debounceTime, fromEvent, Subscription } from 'rxjs';
import { DictionarySelectionSourceDirective } from '@app/shared/dictionary/selection/selection-source.directive';

@Component({
    selector: 'app-video-component',
    imports: [
        MatTooltip,
        MatIcon,
        MatIconButton,
        TranslatePipe,
        DictionarySelectionSourceDirective
    ],
    templateUrl: './video-component.html',
    styleUrl: './video-component.scss',
})
export class VideoComponent implements OnDestroy {
    private keydownSubscription!: Subscription;
    private clearSubtitletipTimer = -1;
    private fileService = inject(FileService);
    private subtitleService = inject(SubtitleService);
    readonly videoPlayer =
        viewChild.required<ElementRef<HTMLVideoElement>>('videoPlayer');
    private userPaused = false;
    subtitleOffsetTip = '';
    translate = inject(TranslateService);
    readonly displaySubtitles = computed<string[]>(() => {
        const subtitles: string[] = [];
        for (const id of this.subtitleService.videoActiveIDs()) {
            const subtitleItem = this.subtitleService.getSubtitle(id);
            subtitleItem?.textLines.forEach((line: string) => {
                subtitles.push(line);
            });
        }
        return subtitles;
    });
    videoSrc: SafeUrl = '';

    constructor() {
        this.initSubtitleOffsetListener();
    }

    /**
     * Listen for keydown events to adjust subtitle offset.
     * "<" key decreases offset by 100ms, ">" key increases offset by 100ms.
     */
    private initSubtitleOffsetListener() {
        this.keydownSubscription = fromEvent<KeyboardEvent>(window, 'keydown')
            .pipe(debounceTime(50))
            .subscribe((event: KeyboardEvent) => {
                let newOffset: number;
                if (!event.shiftKey) {
                    // Only respond when Shift key is held
                    return;
                }

                switch (event.key) {
                    case '<':
                        newOffset =
                            this.subtitleService.adjustSubtitleOffset(-100);
                        this.respondToSubtitleOffsetChange(newOffset);
                        break;
                    case '>':
                        newOffset =
                            this.subtitleService.adjustSubtitleOffset(100);
                        this.respondToSubtitleOffsetChange(newOffset);
                        break;
                }
            });
    }

    private respondToSubtitleOffsetChange(newOffset: number) {
        const signedOffset = newOffset >= 0 ? `+${newOffset}` : `${newOffset}`;
        Logger.debug(`Subtitle offset adjusted to ${signedOffset} ms`);
        this.translate.instant('IMMERSE.SUBTITLE_OFFSET_TIP', {
            offset: signedOffset,
        });
        this.subtitleOffsetTip = `Subtitle offset: ${signedOffset} ms`;
        clearTimeout(this.clearSubtitletipTimer);
        this.clearSubtitletipTimer = window.setTimeout(() => {
            this.subtitleOffsetTip = '';
            this.clearSubtitletipTimer = -1;
        }, 1000);
    }

    ngOnDestroy(): void {
        this.fileService.revokeURL(this.videoSrc);
        this.keydownSubscription.unsubscribe();
    }

    /**
     * Called after a file is selected.
     * @param event - File selection event
     */
    onVideoChange(event: Event): void {
        const handler = (file: File) => {
            console.log('Selected video file:', file);
        };
        this.videoSrc = this.fileService.getURLFromInputElem(
            event,
            this.videoSrc,
            handler,
        );
    }

    /**
     * Called when video metadata is loaded.
     */
    onVideoLoad(): void {
        // Use setTimeout to ensure video.src is fully updated
        setTimeout(() => {
            this.videoPlayer().nativeElement.play();
            Logger.info('Video playback started.');
        }, 0);
    }

    onVideoPlaying(): void {
        const currentTimeInSeconds =
            this.videoPlayer().nativeElement.currentTime;

        const currentTimeInMs = Math.ceil(currentTimeInSeconds * 1000);
        this.subtitleService.pushVideoTime(currentTimeInMs);
    }

    onVideoJump(): void {
        const currentTimeInSeconds =
            this.videoPlayer().nativeElement.currentTime;
        Logger.debug('Video jumped to:', currentTimeInSeconds);

        const currentTimeInMs = Math.ceil(currentTimeInSeconds * 1000);
        this.subtitleService.pushVideoTime(currentTimeInMs);
    }

    pauseOnSubtitleHover(): void {
        this.userPaused = this.videoPlayer().nativeElement.paused;
        this.videoPlayer().nativeElement.pause();
    }

    playIfNotUserPaused(): void {
        if (this.userPaused) {
            return;
        } else {
            this.videoPlayer().nativeElement.play();
        }
    }
}
