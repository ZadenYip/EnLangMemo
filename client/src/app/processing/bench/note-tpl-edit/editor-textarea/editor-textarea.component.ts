import { Component, input, output } from "@angular/core";

@Component({
    selector: "app-note-template-editor-textarea",
    templateUrl: "./editor-textarea.component.html",
    styleUrl: "./editor-textarea.component.scss",
})
export class NoteTemplateEditorTextareaComponent {
    /**
     * Placeholder text for the textarea.
     */
    placeholder = input("");

    /**
     * Current textarea content.
     */
    value = input("");

    /**
     * Emits when the textarea content changes.
     */
    valueChange = output<string>();

    /**
     * Handles textarea input changes.
     */
    onValueChange(event: Event): void {
        const nextValue = (event.target as HTMLTextAreaElement).value;
        this.valueChange.emit(nextValue);
    }
}
