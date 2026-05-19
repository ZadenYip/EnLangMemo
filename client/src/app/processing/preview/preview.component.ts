import { Component, computed, inject, signal } from "@angular/core";
import { MatRadioModule } from "@angular/material/radio";
import { TranslateModule } from "@ngx-translate/core";
import { BenchStateService } from "../bench/bench-state.service";
import { NoteContEditStateService } from "../bench/note-cont-edit/note-cont-edit-state.service";
import { CardTemplate } from "@main/db/services/repetition/note-template/nt-tpl-service.types";

type PreviewSide = "front" | "back";

@Component({
    selector: "app-processing-preview",
    imports: [MatRadioModule, TranslateModule],
    templateUrl: "./preview.component.html",
    styleUrl: "./preview.component.scss",
})
export class ProcessingPreviewComponent {
    private readonly benchState = inject(BenchStateService);
    private readonly noteContEditState = inject(NoteContEditStateService);

    /**
     * Current side shown in the preview.
     */
    readonly previewSide = signal<PreviewSide>("front");

    /**
     * Currently selected card template detail.
     */
    readonly curCardTpl = computed<CardTemplate | null>(() => {
        const noteTpl = this.benchState.curNoteTpl();
        const selectedCardTplId = this.benchState.selectedCardTpl().value;
        if (!noteTpl || !selectedCardTplId) {
            return null;
        }

        return noteTpl.cardtpls.find((cardTpl) => String(cardTpl.id) === selectedCardTplId) ?? null;
    });

    /**
     * Complete HTML document rendered inside the isolated preview iframe.
     */
    readonly previewDocument = computed(() => {
        const noteTpl = this.benchState.curNoteTpl();
        const note = this.noteContEditState.curNote();
        const cardTpl = this.curCardTpl();
        if (!noteTpl || !note || !cardTpl) {
            return "";
        }

        const sideTemplate = this.previewSide() === "front"
            ? cardTpl.front
            : cardTpl.back;
        const renderedCard = this.renderCardTemplate(sideTemplate);

        return [
            "<!doctype html>",
            "<html>",
            "<head>",
            "<meta charset=\"utf-8\">",
            "<style>",
            "html, body { margin: 0; min-height: 100%; }",
            noteTpl.css,
            "</style>",
            "</head>",
            "<body>",
            renderedCard,
            "</body>",
            "</html>",
        ].join("");
    });

    /**
     * Syncs the side selection from radio buttons.
     */
    setPreviewSide(value: PreviewSide): void {
        this.previewSide.set(value);
    }

    /**
     * Replace note template placeholders with current processing note field values.
     */
    private renderCardTemplate(template: string): string {
        const fieldValueMap = this.createFieldValueMap();
        return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, fieldName: string) => {
            const value = fieldValueMap.get(fieldName.trim());
            return value ?? "";
        });
    }

    /**
     * Build field value lookup keyed by note template field name.
     * @returns Map of field name to current processing note field value
     */
    private createFieldValueMap(): Map<string, string> {
        const noteTpl = this.benchState.curNoteTpl();
        const note = this.noteContEditState.curNote();
        const fieldValueMap = new Map<string, string>();
        if (!noteTpl || !note) {
            return fieldValueMap;
        }

        for (const tplField of noteTpl.fields) {
            const value = note.fields.find((field) => field.id === String(tplField.id))?.value ?? "";
            fieldValueMap.set(tplField.name, value);
        }
        return fieldValueMap;
    }
}
