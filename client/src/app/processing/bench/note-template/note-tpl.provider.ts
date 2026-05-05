import { Injectable, signal } from "@angular/core";
import { SelectDropdownOption } from "@render/shared/components/select-dropdown/select-dropdown.component";

type NoteTplSection = "front" | "back" | "css";

@Injectable()
export class NoteTplProvider {
    /**
     * Dropdown options for card templates.
     */
    cardTplOpts: SelectDropdownOption[] = [
        {
            value: "template-a",
            labelKey: "testa",
        },
        {
            value: "template-b",
            labelKey: "testb",
        },
    ];

    /**
     * Dropdown options for note templates.
     */
    noteTplOpts: SelectDropdownOption[] = [
        {
            value: "default-note-template",
            labelKey: "默认",
        },
    ];

    /**
     * Currently selected card template option.
     */
    selCardTpl = signal<SelectDropdownOption>(this.cardTplOpts[0]);

    /**
     * Currently selected note template option.
     */
    selNoteTpl = signal<SelectDropdownOption>(this.noteTplOpts[0]);

    /**
     * Selected note template section.
     */
    section = signal<NoteTplSection>("front");

    /**
     * Front template HTML content.
     */
    frontTpl = signal("");

    /**
     * Back template HTML content.
     */
    backTpl = signal("");

    /**
     * CSS template content.
     */
    cssTpl = signal("");

    /**
     * Update the current card template selection.
     */
    pickCardTpl(option: SelectDropdownOption): void {
        this.selCardTpl.set(option);
    }

    /**
     * UI placeholder for creating a card template.
     */
    addCardTpl(): void {
        // TODO: Implement behavior in the data layer.
    }

    /**
     * Update the current note template selection.
     */
    pickNoteTpl(option: SelectDropdownOption): void {
        this.selNoteTpl.set(option);
    }

    /**
     * Switch the active template section.
     */
    setSection(section: NoteTplSection): void {
        this.section.set(section);
    }

    /**
     * UI placeholder for creating a note template.
     */
    addNoteTpl(): void {
        // TODO: Implement behavior in the data layer.
    }

    /**
     * UI placeholder for note-template settings.
     */
    openNoteTplSettings(): void {
        // TODO: Implement behavior in the data layer.
    }
}