import { Component, inject, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { TranslateModule } from "@ngx-translate/core";
import { ToolIconComponent } from "../tool-icon/tool-icon.component";
import { AutoResizeTextareaComponent } from "@render/shared/components";
import { NoteContEditStateService } from "./note-cont-edit-state.service";
import {
    SelectDropdownComponent,
    SelectDropdownOption,
} from "@render/shared/components/select-dropdown/select-dropdown.component";

@Component({
    selector: "app-note-cont-edit",
    standalone: true,
    imports: [
        MatButtonModule,
        AutoResizeTextareaComponent,
        SelectDropdownComponent,
        ToolIconComponent,
        TranslateModule,
    ],
    templateUrl: "./note-cont-edit.component.html",
    styleUrl: "./note-cont-edit.component.scss",
})
export class NoteContEditComponent implements OnInit {
    readonly noteContEditState = inject(NoteContEditStateService);

    /**
     * Load deck options for the save-and-add toolbar.
     */
    ngOnInit(): void {
        void this.noteContEditState.reloadDeckOptions();
    }

    /**
     * Select the target deck used by save-and-add.
     */
    onDeckSelected(option: SelectDropdownOption): void {
        this.noteContEditState.selectDeck(option);
    }

    /**
     * Update a single note field draft value.
     */
    onFieldValueChange(fieldId: number, value: string): void {
        this.noteContEditState.updateFieldValue(fieldId, value);
    }

    /**
     * Save current note content draft.
     */
    onSaveNoteContent(): void {
        void this.noteContEditState.saveDraft();
    }

    /**
     * Save current note content before the card creation flow is wired.
     */
    onSaveAndAddToDeck(): void {
        // TODO 加进卡池
        void this.noteContEditState.saveDraft();
    }
}
