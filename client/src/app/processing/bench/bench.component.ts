import { Component, signal } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import {
    SelectDropdownComponent,
    SelectDropdownOption,
} from "../../shared/components/select-dropdown/select-dropdown.component";
import { BenchTemplateEditComponent } from "./note-template/note-tpl.component";

type BenchModeValue = "note-content" | "note-template";
interface BenchModeOption extends SelectDropdownOption {
    value: BenchModeValue;
    labelKey: string;
}

@Component({
    selector: "app-processing-bench",
    standalone: true,
    imports: [BenchTemplateEditComponent, SelectDropdownComponent, TranslateModule],
    templateUrl: "./bench.component.html",
    styleUrl: "./bench.component.scss",
})
export class ProcessingBenchComponent {
    /**
     * Available edit modes for the bench dropdown.
     */
    modeOptions: BenchModeOption[] = [
        {
            value: "note-content",
            labelKey: "PAGES.PROCESSING.BENCH.MODES.NOTE_CONTENT",
        },
        {
            value: "note-template",
            labelKey: "PAGES.PROCESSING.BENCH.MODES.NOTE_TEMPLATE",
        },
    ];

    /**
     * Current editing mode for bench content.
     */
    editMode = signal<BenchModeOption>(this.modeOptions[0]);


    /**
     * Switch bench editing mode and close the dropdown.
     */
    selectMode(option: SelectDropdownOption): void {
        this.editMode.set(option as BenchModeOption);
    }
  
}
