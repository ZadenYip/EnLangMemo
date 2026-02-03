import { Component, computed, ElementRef, inject, viewChild } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';
import { FileService } from '../../shared/services/file.service';
import Logger from 'electron-log/renderer';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';
import { SubtitleService } from '../subtitle-service';

@Component({
    selector: 'video-component',
    imports: [MatTooltip, MatIcon, MatIconButton, TranslatePipe],
    templateUrl: './video-component.html',
    styleUrl: './video-component.scss',
})
export class VideoComponent {
    private fileService = inject(FileService);
    private subtitleService = inject(SubtitleService);
    readonly videoPlayer =
        viewChild.required<ElementRef<HTMLVideoElement>>('videoPlayer');
    displaySubtitles = computed<string[]>(() => {
        const subtitles = new Array<string>();
        if (this.subtitleService.activeIDs().size > 0) {
            for (const id of this.subtitleService.activeIDs()) {
                const subtitleItem = this.subtitleService.getSubtitle(id);
                subtitleItem?.textLines.forEach((line: string) => {
                    subtitles.push(line);
                });
            }
            return subtitles;
        } else {
            return subtitles;
        }
    });
    videoSrc: SafeUrl = '';

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

    onVideoPlaying(event: Event): void {
        const currentTimeInSeconds =
            this.videoPlayer().nativeElement.currentTime;

        const currentTimeInMs = Math.ceil(currentTimeInSeconds * 1000);
        this.subtitleService.pushVideoTime(currentTimeInMs);
    }

    onVideoJump(event: Event): void {
        const currentTimeInSeconds =
            this.videoPlayer().nativeElement.currentTime;
        Logger.debug('Video jumped to:', currentTimeInSeconds);

        const currentTimeInMs = Math.ceil(currentTimeInSeconds * 1000);
        this.subtitleService.resetNextActiveIndex();
    }
}
