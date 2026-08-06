import { Component, inject } from "@angular/core";
import { SelectDropdownComponent, SelectDropdownOption } from "@render/shared/components/select-dropdown/select-dropdown.component";
import { BenchStateService } from "../../bench-state.service";

@Component({
    selector: "app-note-tpl-ops",
    imports: [SelectDropdownComponent],
    templateUrl: "./note-tpl-ops.component.html",
    styleUrl: "./note-tpl-ops.component.scss",
    standalone: true,
})
export class NoteTplOpsComponent {
    readonly benchState = inject(BenchStateService);

    /**
     * Select one preset note template for note content and presentation editing.
     */
    pickNoteTpl(option: SelectDropdownOption): void {
        void this.benchState.selectNoteTpl(option);
    }
}
