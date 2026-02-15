import { Component, OnDestroy, OnInit } from '@angular/core';
import { SubtitlePanelComponent } from './subtitle-panel/subtitle-panel';
import { VideoComponent } from './video-component/video-component';
import { SubtitleService } from './subtitle-service';
import Logger from 'electron-log/renderer';

@Component({
    selector: 'app-immerse',
    templateUrl: './immerse.component.html',
    styleUrls: ['./immerse.component.scss'],
    standalone: true,
    providers: [
        SubtitleService
    ],
    imports: [
        SubtitlePanelComponent,
        VideoComponent
    ],
})
export class ImmerseComponent implements OnInit, OnDestroy {

    ngOnInit(): void {
        Logger.info('ImmerseComponent initialized.');
    }

    ngOnDestroy(): void {
        Logger.info('ImmerseComponent destroyed.');
    }
}
