import { Component, computed, inject, signal } from "@angular/core";
import { MatRadioModule } from "@angular/material/radio";
import { TranslateModule } from "@ngx-translate/core";
import { BenchStateService } from "../bench/bench-state.service";
import { NoteContEditStateService } from "../bench/note-cont-edit/note-cont-edit-state.service";
import { CardTemplate } from "@main/db/services/repetition/note-template/nt-tpl-service.types";
import { CardFrameComponent } from "@render/shared/components";
import { CardRenderField, renderCardDocument } from "@render/shared/card-rendering/card-template-renderer";

type PreviewSide = "front" | "back";

@Component({
    selector: "app-processing-preview",
    imports: [CardFrameComponent, MatRadioModule, TranslateModule],
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
        return renderCardDocument({
            css: noteTpl.css,
            template: sideTemplate,
            fields: this.createRenderFields(),
        });
    });

    /**
     * Syncs the side selection from radio buttons.
     */
    setPreviewSide(value: PreviewSide): void {
        this.previewSide.set(value);
    }

    /**
     * Build render fields keyed by note template field name.
     * @returns Field values for the current processing note.
     */
    private createRenderFields(): CardRenderField[] {
        const noteTpl = this.benchState.curNoteTpl();
        const note = this.noteContEditState.curNote();
        if (!noteTpl || !note) {
            return [];
        }

        return noteTpl.fields.map((tplField) => {
            const value = note.fields.find((field) => field.id === String(tplField.id))?.value ?? "";
            return {
                name: tplField.name,
                value,
            };
        });
    }
}
