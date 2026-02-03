import { Injectable, OnDestroy, signal } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { TranslateService } from "@ngx-translate/core";
import { filter, map, Subject, Subscription, throttleTime } from "rxjs";
import { SubtitleManager } from "./find-subtitle-algo/subtitle-manager";
import { GlobalSubtitle } from "./subtitle-interface";

@Injectable()
    export class SubtitleService implements OnDestroy {

    /**
     * notifying subtitle-panel component
     */
    private videoTime$ = new Subject<number>();
    private subscription: Subscription = new Subscription();
    /**
     * currently active subtitle IDs 
     * used for siganling subtitle item components to highlight
     */
    activeIDs = signal<Set<number>>(new Set<number>());
    private subtitleManager: SubtitleManager;
    
    constructor(private translate: TranslateService) {
        this.subtitleManager = new SubtitleManager(
            this.translate.instant(
                'PAGES.IMMERSE.SUBTITLE.EMPTY',
            ),
        );

        this.initSubtitleSync()
    }

    private initSubtitleSync(): void {
        this.subscription.add(this.videoTime$.pipe(
            throttleTime(100),
            map((videoCurTimeMs: number) => this.subtitleManager.nextSubtitleIds(videoCurTimeMs)),
            filter((activeSubtitleIDs: Set<number>) => activeSubtitleIDs.size > 0),
        ).subscribe(
            (activeSubtitleIDs: Set<number>) => {
                // signal subtitle item components to highlight
                this.activeIDs.set(activeSubtitleIDs);
            }
        ));
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    get subtitles(): GlobalSubtitle[] {
        return this.subtitleManager.subtitles;
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

    public resetNextActiveIndex(): void {
        this.subtitleManager.resetNextActiveIndex();
    }
    
}