import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { Component, inject, OnDestroy, OnInit, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltip } from '@angular/material/tooltip';
import { SafeUrl } from '@angular/platform-browser';
import { TranslatePipe, TranslateService, TranslateDirective } from '@ngx-translate/core';
import { SubtitleManager } from '../../find-subtitle-algo/subtitle-manager'; 
import { SubtitleService } from '../../subtitle-service'; 
import { FileService } from '../../../shared/services/file.service';
import Logger from 'electron-log/renderer';
import { filter, map, Subscription, throttleTime } from 'rxjs';


@Component({
    selector: 'subtitle-panel',
    imports: [
    CdkVirtualScrollViewport,
    ScrollingModule,
    MatIconModule,
    MatButtonModule,
    TranslatePipe,
    MatSnackBarModule,
    MatTooltip
],
    templateUrl: './subtitle-panel.component.html',
    styleUrl: './subtitle-panel.component.scss',
})
export class SubtitlePanelComponent implements OnInit, OnDestroy {
    private fileService = inject(FileService);
    private translate = inject(TranslateService);
    private subscribeVideoPlaying$ = new Subscription();

    readonly subtitleListView =
        viewChild.required<CdkVirtualScrollViewport>('subtitleList');
    subtitleSrc: SafeUrl = '';
    private notificationBar = inject(MatSnackBar);
    private subtitleService = inject(SubtitleService);

    subtitleManager: SubtitleManager;
    activeSubtitleIDs: Set<number> = new Set();
    

    constructor() {
        this.subtitleManager = new SubtitleManager(
            this.translate.instant(
                'PAGES.IMMERSE.SUBTITLE.EMPTY',
            ),
        );
    }

    ngOnInit(): void {
        Logger.info('SubtitlePanelComponent initialized.');
        this.createSubtitleHighlightTrigger();
    }

    private createSubtitleHighlightTrigger() {
        this.subscribeVideoPlaying$ = this.subtitleService.subtitleUpdateTrigger$.pipe(
            throttleTime(100),
            map((videoCurTimeMs: number) => this.subtitleManager.nextSubtitleIds(videoCurTimeMs)),
            filter((activeSubtitleIDs: Set<number>) => activeSubtitleIDs.size > 0),
        ).subscribe(
            (activeSubtitleIDs: Set<number>) => {
                this.activeSubtitleIDs = activeSubtitleIDs;
            }
        );
    }

    ngOnDestroy(): void {
        this.subscribeVideoPlaying$.unsubscribe();
    }

    /**
     *
     * @param event - Subtitle file selection event
     */
    onSubtitleChange(event: Event): void {
        const handler = async (file: File) => {
            Logger.info('Selected subtitle file:', file);
            this.subtitleManager = await this.subtitleService.loadSubtitle(
                file,
                this.notificationBar,
            );
        };

        this.subtitleSrc = this.fileService.getURLFromInputElem(
            event,
            this.subtitleSrc,
            handler,
        );
    }

    trackBySubtitleId(index: number, subtitle: { id: number }): number {
        return subtitle.id;
    }
}
