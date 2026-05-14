import { inject, Injectable, linkedSignal } from "@angular/core";
import {
    NoteTemplate,
    NoteTemplateSaveResult,
} from "@main/db/services/repetition/note/nt-service.types";
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

    private readonly activeCard = linkedSignal(() => {
        const noteTpl = this.benchState.curNoteTpl();
        const cardTplId = this.benchState.selectedCardTpl().value;
        return noteTpl?.cardtpls.find((cardTpl) => String(cardTpl.id) === cardTplId) ?? null;
    });
    
    /**
     * Draft content for current card front template.
     */
    readonly frontTpl = linkedSignal(() => this.activeCard()?.front ?? "");

    /**
     * Draft content for current card back template.
     */
    readonly backTpl = linkedSignal(() => this.activeCard()?.back ?? "");

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
     * Save current note template edit draft.
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
            const cardTplId = this.benchState.selectedCardTpl().value;
            if (!noteTpl || !noteTplId || !cardTplId) {
                Logger.warn("Save template failed: not found");
                return {
                    state: "not-found",
                };
            }

            const nextNoteTpl = this.createNextNoteTpl(noteTpl, cardTplId);
            const result = await window.service.nt.saveNoteTpl(noteTplId, nextNoteTpl);
            if (result.state === "success") {
                this.benchState.replaceCurNoteTpl(nextNoteTpl);
            }
            return result;
        } finally {
            this.benchState.endBusy();
        }
    }

    /**
     * Merge current draft into a new note template object.
     */
    private createNextNoteTpl(noteTpl: NoteTemplate, cardTplId: string): NoteTemplate {
        const nextCardTpls = noteTpl.cardtpls.map((cardTpl) =>
            String(cardTpl.id) === cardTplId
                ? {
                    ...cardTpl,
                    front: this.frontTpl(),
                    back: this.backTpl(),
                }
                : cardTpl,
        );

        return {
            ...noteTpl,
            css: this.cssTpl(),
            cardtpls: nextCardTpls,
        };
    }

}
