import { Component, signal } from "@angular/core";
import { MatRadioModule } from "@angular/material/radio";
import { TranslateModule } from "@ngx-translate/core";

@Component({
    selector: "app-processing-preview",
    imports: [MatRadioModule, TranslateModule],
    templateUrl: "./preview.component.html",
    styleUrl: "./preview.component.scss",
})
export class ProcessingPreviewComponent {
    /**
     * Current side shown in the preview.
     */
    previewSide = signal("front");

    /**
     * Syncs the side selection from radio buttons.
     */
    setPreviewSide(value: string): void {
        this.previewSide.set(value);
    }
}
