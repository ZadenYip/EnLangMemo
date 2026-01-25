import { Component, OnDestroy, OnInit } from '@angular/core';
import { SubtitlePanelComponent } from './subtitle-component/subtitle-panel/subtitle-panel.component';
import { VideoComponent } from './video-component/video-component/video-component.component';

@Component({
    selector: 'app-immerse',
    templateUrl: './immerse.component.html',
    styleUrls: ['./immerse.component.scss'],
    standalone: true,
    providers: [],
    imports: [SubtitlePanelComponent, VideoComponent],
})
export class ImmerseComponent implements OnInit, OnDestroy {

    ngOnInit(): void {
        console.log('ImmerseComponent initialized.');
    }

    ngOnDestroy(): void {
        console.log('ImmerseComponent destroyed.');
    }
}
