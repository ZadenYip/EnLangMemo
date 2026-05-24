import { Component } from "@angular/core";
import { ProcessingBenchComponent } from "./bench/bench.component";
import { ProcessingPreviewComponent } from "./preview/preview.component";
import { BenchStateService } from "./bench/bench-state.service";
import { NoteContEditStateService } from "./bench/note-cont-edit/note-cont-edit-state.service";
import { TplEditStateService } from "./bench/note-tpl-edit/tpl-edit-state.service";

@Component({
    selector: "app-processing",
    providers: [BenchStateService, TplEditStateService, NoteContEditStateService],
    imports: [
        ProcessingBenchComponent,
        ProcessingPreviewComponent
    ],
    templateUrl: "./processing.component.html",
    styleUrl: "./processing.component.scss",
})
export class ProcessingComponent {
    
}
