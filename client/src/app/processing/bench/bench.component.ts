import { Component, inject, OnInit, signal } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import {
    SelectDropdownComponent,
    SelectDropdownOption,
} from "../../shared/components/select-dropdown/select-dropdown.component";
import { TplEditComponent } from "./note-tpl-edit/tpl-edit.component";
import { NoteTplOpsComponent } from "./note-tpl-edit/note-tpl-ops/note-tpl-ops.component";
import { BenchStateService } from "./bench-state.service";
import { CardTplOpsComponent } from "./note-tpl-edit/card-tpl-ops/card-tpl-ops.component";
import { NoteContEditComponent } from "./note-cont-edit/note-cont-edit.component";
import { TplEditStateService } from "./note-tpl-edit/tpl-edit-state.service";
import { NoteContEditStateService } from "./note-cont-edit/note-cont-edit-state.service";

type BenchModeValue = "note-content" | "note-template";
interface BenchModeOption extends SelectDropdownOption {
    value: BenchModeValue;
    labelKey: string;
}

@Component({
    selector: "app-processing-bench",
    standalone: true,
    providers: [BenchStateService, TplEditStateService, NoteContEditStateService],
    imports: [
        TplEditComponent,
        SelectDropdownComponent,
        CardTplOpsComponent,
        NoteContEditComponent,
        NoteTplOpsComponent,
        TranslateModule,
    ],
    templateUrl: "./bench.component.html",
    styleUrl: "./bench.component.scss",
})
export class ProcessingBenchComponent implements OnInit {
    readonly benchState = inject(BenchStateService);

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
     * Load initial note template context for bench child components.
     */
    ngOnInit(): void {
        void this.benchState.loadNoteTplRefs();
    }

    /**
     * Switch bench editing mode and close the dropdown.
     */
    selectMode(option: SelectDropdownOption): void {
        this.editMode.set(option as BenchModeOption);
    }
  
}
