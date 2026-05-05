import { Component, signal } from "@angular/core";
import { MatRadioModule } from "@angular/material/radio";
import { TranslateModule } from "@ngx-translate/core";
import { SelectDropdownComponent, SelectDropdownOption } from "@render/shared/components/select-dropdown/select-dropdown.component";
import { NoteTemplateEditorTextareaComponent } from "./editor-textarea/editor-textarea.component";


type NoteTemplateSection = "front" | "back" | "css";

@Component({
    selector: "app-bench-note-template",
    imports: [
        MatRadioModule,
        NoteTemplateEditorTextareaComponent,
        SelectDropdownComponent,
        TranslateModule,
    ],
    templateUrl: "./note-template.component.html",
    styleUrl: "./note-template.component.scss",
})
export class BenchNoteTemplateComponent {
    /**
     * Dropdown options for card templates.
     */
    cardTemplateOptions: SelectDropdownOption[] = [
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
     * Currently selected card template option.
     */
    selectedCardTemplate = signal<SelectDropdownOption>(this.cardTemplateOptions[0]);

    /**
     * Selected note template section.
     */
    selectedSection = signal<NoteTemplateSection>("front");

    /**
     * Front template HTML content.
     */
    frontTemplateContent = signal("");

    /**
     * Back template HTML content.
     */
    backTemplateContent = signal("");

    /**
     * CSS template content.
     */
    cssTemplateContent = signal("");

    /**
     * Update the current card template selection.
     */
    selectCardTemplate(option: SelectDropdownOption): void {
        this.selectedCardTemplate.set(option);
    }

    /**
     * Switch the active template section.
     */
    selectSection(section: NoteTemplateSection): void {
        this.selectedSection.set(section);
    }

    /**
     * Handle the edit action for the current card template.
     */
    editCurrentTemplate(): void {
        // TODO: Wire up to actual editor action.
    }
}
