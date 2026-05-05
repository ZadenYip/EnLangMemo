import { Component, input, output } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { SelectDropdownComponent, SelectDropdownOption } from "@render/shared/components/select-dropdown/select-dropdown.component";
import { ToolIconComponent } from "../../tool-icon/tool-icon.component";

@Component({
    selector: "app-note-tpl-ops",
    imports: [SelectDropdownComponent, ToolIconComponent, TranslateModule],
    templateUrl: "./note-tpl-ops.component.html",
    styleUrl: "./note-tpl-ops.component.scss",
    standalone: true,
})
export class NoteTplOpsComponent {
    /**
     * Dropdown options for note templates.
     */
    opts = input.required<SelectDropdownOption[]>();

    /**
     * Currently selected note template option.
     */
    selected = input.required<SelectDropdownOption>();

    /**
     * Emits when the selected note template changes.
     */
    selectedChange = output<SelectDropdownOption>();

    /**
     * Emits when the add button is clicked.
     */
    addClick = output<void>();

    /**
     * Emits when the settings button is clicked.
     */
    settingsClick = output<void>();
}
