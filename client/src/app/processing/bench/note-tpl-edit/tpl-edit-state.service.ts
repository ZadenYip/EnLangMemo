import { inject, Injectable, linkedSignal } from "@angular/core";
import {
    NoteTemplate,
    NoteTemplateSaveResult,
} from "@main/db/services/repetition/note-template/nt-tpl-service-types";
import { BenchStateService } from "../bench-state.service";
import Logger from "electron-log/renderer";

export type NoteTplSection = "front" | "back" | "css";

@Injectable()
export class TplEditStateService {
    private readonly benchState = inject(BenchStateService);

    /**
     * Whether template edit actions are currently locked by async work.
     */
    readonly isBusy = this.benchState.isBusy;

    /**
     * Draft content for current fixed front template.
     */
    readonly frontTpl = linkedSignal(() => this.benchState.curNoteTpl()?.front ?? "");

    /**
     * Draft content for current fixed back template.
     */
    readonly backTpl = linkedSignal(() => this.benchState.curNoteTpl()?.back ?? "");

    /**
     * Draft css content for current note template.
     */
    readonly cssTpl = linkedSignal(() => this.benchState.curNoteTpl()?.css ?? "");

    /**
     * Update draft content by active template section.
     */
    updateDraft(section: NoteTplSection, content: string): void {
        switch (section) {
            case "front":
                this.frontTpl.set(content);
                return;
            case "back":
                this.backTpl.set(content);
                return;
            case "css":
                this.cssTpl.set(content);
                return;
        }
    }

    /**
     * Save current note template presentation draft.
     */
    async saveDraft(): Promise<NoteTemplateSaveResult | { state: "not-found" } | { state: "busy" }> {
        if (!this.benchState.beginBusy()) {
            return {
                state: "busy",
            };
        }
        try {
            const noteTpl = this.benchState.curNoteTpl();
            const noteTplId = this.benchState.selectedNoteTpl().value;
            if (!noteTpl || !noteTplId) {
                Logger.warn("Save template failed: not found");
                return {
                    state: "not-found",
                };
            }

            const nextNoteTpl = this.createNextNoteTpl(noteTpl);
            const result = await window.service.ntTpl.saveNoteTpl(noteTplId, nextNoteTpl);
            if (result.state === "success") {
                this.benchState.replaceCurNoteTpl(nextNoteTpl);
            }
            return result;
        } finally {
            this.benchState.endBusy();
        }
    }

    /**
     * Merge editable draft fields into a new note template object.
     */
    private createNextNoteTpl(noteTpl: NoteTemplate): NoteTemplate {
        return {
            ...noteTpl,
            css: this.cssTpl(),
            front: this.frontTpl(),
            back: this.backTpl(),
        };
    }

}
