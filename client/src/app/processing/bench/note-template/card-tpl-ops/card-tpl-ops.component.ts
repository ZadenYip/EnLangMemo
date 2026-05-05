import { Component, input, output } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { SelectDropdownComponent, SelectDropdownOption } from "@render/shared/components/select-dropdown/select-dropdown.component";
import { ToolIconComponent } from "../../tool-icon/tool-icon.component";

@Component({
    selector: "app-card-tpl-ops",
    imports: [SelectDropdownComponent, ToolIconComponent, TranslateModule],
    templateUrl: "./card-tpl-ops.component.html",
    styleUrl: "./card-tpl-ops.component.scss",
    standalone: true,
})
export class CardTplOpsComponent {
    /**
     * Dropdown options for card templates.
     */
    opts = input.required<SelectDropdownOption[]>();

    /**
     * Currently selected card template option.
     */
    selected = input.required<SelectDropdownOption>();

    /**
     * Emits when the selected card template changes.
     */
    selectedChange = output<SelectDropdownOption>();

    /**
     * Emits when the add button is clicked.
     */
    addClick = output<void>();
}
