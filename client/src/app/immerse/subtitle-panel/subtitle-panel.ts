import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { AfterViewInit, Component, effect, inject, OnDestroy, OnInit, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltip } from '@angular/material/tooltip';
import { SafeUrl } from '@angular/platform-browser';
import { TranslatePipe } from '@ngx-translate/core';
import { SubtitleService } from '../subtitle-service';
import { FileService } from '@shared/services/file.service';
import Logger from 'electron-log/renderer';
import { Subscription } from 'rxjs';
import { SubtitleItemComponent } from './item/subtitle-item';
import { DictionarySelectionSourceDirective } from '@app/shared/dictionary/selection/selection-source.directive';

@Component({
    selector: 'app-subtitle-panel',
    imports: [
    CdkVirtualScrollViewport,
    ScrollingModule,
    MatIconModule,
    MatButtonModule,
    TranslatePipe,
    MatSnackBarModule,
    MatTooltip,
    SubtitleItemComponent,
    DictionarySelectionSourceDirective
],
    templateUrl: './subtitle-panel.html',
    styleUrl: './subtitle-panel.scss',
})
export class SubtitlePanelComponent implements OnInit, OnDestroy, AfterViewInit {
    private fileService = inject(FileService);
    private notificationBar = inject(MatSnackBar);
    private firstSubtitleInViewPoint = 0;
    subtitleService = inject(SubtitleService);
    
    readonly subtitleListView =
    viewChild.required<CdkVirtualScrollViewport>('subtitleList');
    subtitleSrc: SafeUrl = '';
    subscription: Subscription = new Subscription();

    constructor() {
        this.initAutoScroll();
    }

    ngOnInit(): void {
        Logger.info('SubtitlePanelComponent initialized.');
    }

    ngOnDestroy(): void {
        this.fileService.revokeURL(this.subtitleSrc);
    }

    ngAfterViewInit(): void {
        this.trackFirstSubtitleInView();
    }

    private trackFirstSubtitleInView(): void {
        this.subscription.add(this.subtitleListView().scrolledIndexChange.subscribe(
            (index: number) => {
                this.firstSubtitleInViewPoint = index;
                Logger.debug('First subtitle in view index updated to:', index);
            }
        ));
    }

    private initAutoScroll(): void {
        effect(() => {
            for (const id of this.subtitleService.panelActiveIDs().values()) {
                const index = id - 1;
                const distance = Math.abs(this.firstSubtitleInViewPoint - index);
                if (distance >= 4) {
                    Logger.debug(`Auto-scrolling to subtitle ID: ${id} at index ${index}`);
                    if (distance >= 20) {
                        this.subtitleListView().scrollToIndex(index, 'auto');
                    } else {
                        this.subtitleListView().scrollToIndex(index, 'smooth');
                    }
                }
                break;
            }
        })
    }


    /**
     *
     * @param event - Subtitle file selection event
     */
    onSubtitleChange(event: Event): void {
        const handler = async (file: File) => {
            Logger.info('Selected subtitle file:', file);
            await this.subtitleService.loadSubtitle(
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

}
