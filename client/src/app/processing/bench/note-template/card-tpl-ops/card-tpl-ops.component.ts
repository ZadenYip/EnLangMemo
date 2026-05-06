import { Component, input, output } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { SelectDropdownComponent, SelectDropdownOption } from "@render/shared/components/select-dropdown/select-dropdown.component";
import { MatMenuModule } from "@angular/material/menu";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";

/**
 * Available actions emitted by the card template ops menu.
 */
export type CardTplOpsAction = "add";

@Component({
    selector: "app-card-tpl-ops",
    imports: [SelectDropdownComponent, MatMenuModule, MatIconModule, MatButtonModule, TranslateModule],
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
     * Emits when a card template menu action is selected.
     */
    menuClick = output<CardTplOpsAction>();
}
