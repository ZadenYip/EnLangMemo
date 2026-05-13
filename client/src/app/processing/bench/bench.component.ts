import { Component, inject, signal } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import {
    SelectDropdownComponent,
    SelectDropdownOption,
} from "../../shared/components/select-dropdown/select-dropdown.component";
import { BenchTemplateEditComponent } from "./note-tpl-edit/note-tpl.component";
import { NoteTplOpsComponent } from "./note-tpl-edit/note-tpl-ops/note-tpl-ops.component";
import { BenchStateService } from "./bench-state.service";
import { CardTplOpsComponent } from "./note-tpl-edit/card-tpl-ops/card-tpl-ops.component";

type BenchModeValue = "note-content" | "note-template";
interface BenchModeOption extends SelectDropdownOption {
    value: BenchModeValue;
    labelKey: string;
}

@Component({
    selector: "app-processing-bench",
    standalone: true,
    providers: [BenchStateService],
    imports: [
        BenchTemplateEditComponent,
        SelectDropdownComponent,
        CardTplOpsComponent,
        NoteTplOpsComponent,
        TranslateModule,
    ],
    templateUrl: "./bench.component.html",
    styleUrl: "./bench.component.scss",
})
export class ProcessingBenchComponent {
    private readonly benchState = inject(BenchStateService);

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

    /**
     * Forward card template selection to the active template editor.
     */
    onCardTplSelected(option: SelectDropdownOption): void {
        this.benchState.selectCardTpl(option);
    }

    /**
     * Forward note template selection to the active template editor.
     */
    onNoteTplSelected(option: SelectDropdownOption): void {
        void this.benchState.selectNoteTpl(option);
    }
  
}
