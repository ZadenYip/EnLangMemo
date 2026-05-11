import { Component, output } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { createEmptyOption, SelectDropdownComponent, SelectDropdownOption } from "@render/shared/components/select-dropdown/select-dropdown.component";
import { MatMenuModule } from "@angular/material/menu";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";

/**
 * Available actions emitted by the card template ops menu.
 */
export type CardTplOpsAction = "create" | "delete";

@Component({
    selector: "app-card-tpl-ops",
    imports: [SelectDropdownComponent, MatMenuModule, MatIconModule, MatButtonModule, TranslateModule],
    templateUrl: "./card-tpl-ops.component.html",
    styleUrl: "./card-tpl-ops.component.scss",
    standalone: true,
})
export class CardTplOpsComponent {

    /**
     * Dropdown options for note templates.
     */
    opts: SelectDropdownOption[] = [];
    /**
     * Currently selected note template option.
     */
    selected = createEmptyOption();

    /**
     * Emits when the selected note template changes.
     */
    selectedChange = output<SelectDropdownOption>();

    /**
     * Reload card-template options from NoteTplService cache.
     */
    syncFromService(opts: SelectDropdownOption[]): void {
        this.opts = opts;
        this.selected = opts[0] ?? createEmptyOption();
        this.selectedChange.emit(this.selected);
    }

    pickCardTpl(option: SelectDropdownOption): void {
        this.selected = option;
        this.selectedChange.emit(option);
    }

    onMenuAction(_action: CardTplOpsAction): void {
        // TODO
    }
}
