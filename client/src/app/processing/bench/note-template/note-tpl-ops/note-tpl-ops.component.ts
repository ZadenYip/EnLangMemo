import { Component, input, output } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { SelectDropdownComponent, SelectDropdownOption } from "@render/shared/components/select-dropdown/select-dropdown.component";
import { MatMenuModule } from "@angular/material/menu";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { NoteTplOption } from "../note-tpl.vm";

/**
 * Available actions emitted by the note template ops menu.
 */
export type NoteTplOpsAction = "add" | "delete" | "settings";

@Component({
    selector: "app-note-tpl-ops",
    imports: [SelectDropdownComponent, MatMenuModule, MatIconModule, MatButtonModule, TranslateModule],
    templateUrl: "./note-tpl-ops.component.html",
    styleUrl: "./note-tpl-ops.component.scss",
    standalone: true,
})
export class NoteTplOpsComponent {
    /**
     * Dropdown options for note templates.
     */
    opts = input.required<NoteTplOption[]>();

    /**
     * Currently selected note template option.
     */
    selected = input.required<NoteTplOption>();

    /**
     * Emits when the selected note template changes.
     */
    selectedChange = output<NoteTplOption>();

    /**
     * Emits when a note template menu action is selected.
     */
    menuClick = output<NoteTplOpsAction>();

    pickNoteTpl(option: SelectDropdownOption): void {
        this.selectedChange.emit(option as NoteTplOption);
    }
}
