import { Injectable, Signal } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { TranslateService } from "@ngx-translate/core";
import { filter, map, Subject, Subscription, throttleTime } from "rxjs";
import { SubtitleManager } from "./find-subtitle-algo/subtitle-manager";
import { GlobalSubtitle } from "./subtitle-interface";
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable()
    export class SubtitleService {

    /**
     * notifying subtitle-panel component
     */
    private videoTime$ = new Subject<number>();
    private subtitleOffsetMs = 0;
    
    panelActiveIDs: Signal<Set<number>>;
    videoActiveIDs: Signal<Set<number>>;
    
    private subtitleManager: SubtitleManager;
    
    constructor(private translate: TranslateService) {
        this.subtitleManager = new SubtitleManager(
            this.translate.instant(
                'PAGES.IMMERSE.SUBTITLE.EMPTY',
            ),
        );


        // filtering active IDs for panel (only non-empty sets)
        this.panelActiveIDs = toSignal(this.getActiveIDsStream().pipe(filter(activeIDs => activeIDs.size > 0)), { initialValue: new Set<number>()} );
        this.videoActiveIDs = toSignal(this.getActiveIDsStream(), { initialValue: new Set<number>() });
    }

    private getActiveIDsStream() {
        return this.videoTime$.pipe(
            throttleTime(10),
            map((videoCurTimeMs: number) => {
                const adjustedTime = videoCurTimeMs + this.subtitleOffsetMs;
                return this.subtitleManager.nextSubtitleIds(adjustedTime)
            }
        ));
    }

    get subtitles(): GlobalSubtitle[] {
        return this.subtitleManager.subtitles;
    }

    /**
     * 
     * @param offsetMs - increase/decrease time in ms
     * @returns incresed/decresed time in ms
     */
    public adjustSubtitleOffset(offsetMs: number): number {
        this.subtitleOffsetMs += offsetMs;
        return this.subtitleOffsetMs;
    }
    

    /**
     * 
     * @param id - start from 0
     * @returns 
     */
    public getSubtitle(id: number): GlobalSubtitle | null {
        if (id < 0 || id >= this.subtitleManager.subtitles.length) {
            return null;
        }
        return this.subtitleManager.subtitles[id];
    }
    
    /**
     * 
     * @param videoCurTimeMs - video time
     */
    public pushVideoTime(videoCurTimeMs: number): void {
        this.videoTime$.next(videoCurTimeMs);
    }

    public async loadSubtitle(file: File, notificationBar: MatSnackBar): Promise<void> {
        const filePath = window.electron.webUtils.getPathForFile(file);
        this.subtitleManager = new SubtitleManager();
        
        return new Promise<void>((resolve, reject) => {
            window.observables.subtitleService.fetchSubtitles$(filePath).subscribe({
                next: (cue) => {
                    console.debug('Received subtitle cue:', cue);
                    this.subtitleManager.add(cue);
                },
                error: (err) => {
                    console.error('Error fetching subtitles:', err);
                    notificationBar.open(
                        this.translate.instant(
                            'PAGES.IMMERSE.SUBTITLE.FAIL_TO_LOAD_MSG'
                        ),
                        this.translate.instant(
                            'PAGES.IMMERSE.SUBTITLE.FAIL_TO_LOAD_ACTION'
                        )
                    );
                    reject(err);
                },
                complete: () => {
                    console.log('Completed fetching subtitles.');
                    console.log('Total subtitles loaded:', this.subtitleManager.subtitles.length);
                    notificationBar.open(
                        this.translate.instant(
                            'PAGES.IMMERSE.SUBTITLE.SUCCESS_LOAD_MSG'
                        ),
                        this.translate.instant(
                            'PAGES.IMMERSE.SUBTITLE.SUCCESS_LOAD_ACTION'
                        ),
                        { duration: 3000 }
                    );
                    resolve();
                    this.subtitleManager.refreshSubtitlesRef();
                },
          });
        });
    }
    
}