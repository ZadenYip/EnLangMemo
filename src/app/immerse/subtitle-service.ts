import { Injectable } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { GlobalSubtitle } from "./subtitle-interface";
import { TranslateService } from "@ngx-translate/core";
import { Subject } from "rxjs";
import { SubtitleManager } from "./find-subtitle-algo/subtitle-manager";

@Injectable({
    providedIn: 'root',
})
export class SubtitleService {
    /**
     * notifying subtitle-panel component
     */
    subtitleUpdateTrigger$ = new Subject<number>(); 
    
    constructor(private translate: TranslateService) {}

    public notifySubtitleUpdate(videoCurTimeMs: number): void {
        this.subtitleUpdateTrigger$.next(videoCurTimeMs);
    }

    public async loadSubtitle(file: File, notificationBar: MatSnackBar): Promise<SubtitleManager> {
        // Clear existing subtitles
        const subtitleList: GlobalSubtitle[] = [];

        const filePath = window.electron.webUtils.getPathForFile(file);
        const subtitleManager = new SubtitleManager();
        
        return new Promise<SubtitleManager>((resolve, reject) => {
            window.observables.subtitleService.fetchSubtitles$(filePath).subscribe({
                next: (cue) => {
                    console.debug('Received subtitle cue:', cue);
                    subtitleManager.add(cue);
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
                    console.log('Total subtitles loaded:', subtitleList.length);
                    notificationBar.open(
                        this.translate.instant(
                            'PAGES.IMMERSE.SUBTITLE.SUCCESS_LOAD_MSG'
                        ),
                        this.translate.instant(
                            'PAGES.IMMERSE.SUBTITLE.SUCCESS_LOAD_ACTION'
                        ),
                        { duration: 3000 }
                    );
                    resolve(subtitleManager);
                },
          });
        });
    }
    
}