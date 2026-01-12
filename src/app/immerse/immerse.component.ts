import {
    Component,
    ElementRef,
    inject,
    OnDestroy,
    SecurityContext,
    viewChild,
} from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import log from 'electron-log/renderer';
import {
    CdkVirtualScrollViewport,
    ScrollingModule,
} from '@angular/cdk/scrolling';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { GlobalSubtitle } from './subtitle-interface';

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
        MatSnackBarModule,
    ],
})
export class ImmerseComponent implements OnDestroy {
    private notificationBar = inject(MatSnackBar);
    readonly videoPlayer =
        viewChild.required<ElementRef<HTMLVideoElement>>('videoPlayer');
    readonly subtitleListView =
        viewChild.required<CdkVirtualScrollViewport>('subtitleList');
    videoSrc: SafeUrl = '';
    subtitleSrc: SafeUrl = '';
    subtitles: GlobalSubtitle[] = [
        { id: 1, startTime: 0, endTime: 2000, textLines: ['Welcome to Immerse Player!'] }
    ];

    constructor(private sanitizer: DomSanitizer, private translate: TranslateService) {}

    ngOnDestroy(): void {
        console.log('ImmerseComponent destroyed.');
        // TODO Refactor the URL operations
    }   

    /**
     * Called after a file is selected.
     * @param event - File selection event
     */
    onVideoChange(event: Event): void {
        const handler = (file: File) => {
            console.log('Selected video file:', file);
        };
        this.videoSrc = this.getURLFromInputElem(event, this.videoSrc, handler);
    }

    onSubtitleChange(event: Event): void {
        const handler = (file: File) => {
            console.log('Selected subtitle file:', file);
            this.loadSubtitleFile(file);
        };
        this.subtitleSrc = this.getURLFromInputElem(
            event,
            this.subtitleSrc,
            handler
        );
    }

    private loadSubtitleFile(file: File): void {
        // Clear existing subtitles
        this.subtitles = [];
        let newSubtitles: GlobalSubtitle[] = [];
        const filePath = window.electron.webUtils.getPathForFile(file);

        window.observables.subtitleService.fetchSubtitles$(filePath).subscribe({
            next: (cue) => {
                console.debug('Received subtitle cue:', cue);
                newSubtitles.push(cue);
            },
            error: (err) => {
                console.error('Error fetching subtitles:', err);
                this.notificationBar.open(
                    this.translate.instant(
                        'PAGES.IMMERSE.SUBTITLE.FAIL_TO_LOAD_MSG'
                    ),
                    this.translate.instant(
                        'PAGES.IMMERSE.SUBTITLE.FAIL_TO_LOAD_ACTION'
                    )
                );
            },
            complete: () => {
                console.log('Completed fetching subtitles.');
                // trigger subtitle list re-render
                this.subtitles = newSubtitles;
                console.log('Total subtitles loaded:', this.subtitles.length);
                this.notificationBar.open(
                    this.translate.instant(
                        'PAGES.IMMERSE.SUBTITLE.SUCCESS_LOAD_MSG'
                    ),
                    this.translate.instant(
                        'PAGES.IMMERSE.SUBTITLE.SUCCESS_LOAD_ACTION'
                    ),
                    { duration: 3000 }
                );
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
    getURLFromInputElem(
        event: Event,
        safeUrl: SafeUrl,
        handle?: (file: File) => void
    ): SafeUrl {
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
    onVideoLoad(): void {
        // Use setTimeout to ensure video.src is fully updated
        setTimeout(() => {
            this.videoPlayer().nativeElement.play();
            log.info('Video playback started.');
        }, 0);
    }

    onVideoPlaying(event: Event): void {
        const currentTimeInSeconds =
            this.videoPlayer().nativeElement.currentTime;
        log.debug('Current video time:', currentTimeInSeconds);
        this.updateCurrentSubtitle(currentTimeInSeconds);
    }

    private updateCurrentSubtitle(currentTimeInSeconds: number): void {
        const ms = Math.ceil(currentTimeInSeconds * 1000);
        // TODO Implement subtitle highlighting based on current time
    }

    
}
