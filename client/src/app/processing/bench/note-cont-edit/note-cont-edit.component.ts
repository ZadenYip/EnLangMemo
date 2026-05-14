import { Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { TranslateModule } from "@ngx-translate/core";
import { ToolIconComponent } from "../tool-icon/tool-icon.component";
import { AutoResizeTextareaComponent } from "@render/shared/components";
import { NoteContEditStateService } from "./note-cont-edit-state.service";

@Component({
    selector: "app-note-cont-edit",
    standalone: true,
    imports: [
        MatButtonModule,
        AutoResizeTextareaComponent,
        ToolIconComponent,
        TranslateModule,
    ],
    templateUrl: "./note-cont-edit.component.html",
    styleUrl: "./note-cont-edit.component.scss",
})
export class NoteContEditComponent {
    readonly noteContEditState = inject(NoteContEditStateService);

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
        this.noteContEditState.saveDraft();
    }
}
