import { Component } from "@angular/core";
import { ProcessingBenchComponent } from "./bench/bench.component";
import { ProcessingPreviewComponent } from "./preview/preview.component";

@Component({
    selector: "app-processing",
    imports: [
        ProcessingBenchComponent,
        ProcessingPreviewComponent
    ],
    templateUrl: "./processing.component.html",
    styleUrl: "./processing.component.scss",
})
export class ProcessingComponent {
    
}
