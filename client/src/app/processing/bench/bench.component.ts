import { Component, signal } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";

@Component({
    selector: "app-processing-bench",
    imports: [TranslateModule],
    templateUrl: "./bench.component.html",
    styleUrl: "./bench.component.scss",
})
export class ProcessingBenchComponent {
    /**
     * Current editing mode for bench content.
     */
    editMode = signal("rich-text");
}
