import { Component, computed, HostBinding, inject, input } from '@angular/core';
import { SubtitleService } from '@app/immerse/subtitle-service';

@Component({
    selector: '[app-subtitle-item]',
    templateUrl: './subtitle-item.html',
    styleUrls: ['./subtitle-item.scss'],
    host: {
        '[class.subtitle-active]': 'isActive()'
    }
})
export class SubtitleItemComponent {
    private subtitleService = inject(SubtitleService);
    id = input<number>(-1);
    textLines = input<string[]>([]);

    /**
     * whether this subtitle item is currently active/highlighted
     */
    isActive = computed(() => {
        return this.subtitleService.panelActiveIDs().has(this.id());
    });

}
