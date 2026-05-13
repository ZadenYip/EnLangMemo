import { Injectable, signal } from "@angular/core";
import { CardTemplate, NoteTemplate } from "@main/db/services/repetition/note/nt-service.types";
import {
    createEmptyOption,
    SelectDropdownOption,
} from "@render/shared/components/select-dropdown/select-dropdown.component";

@Injectable()
export class BenchStateService {
    private readonly noteTplRefMap = new Map<string, SelectDropdownOption>();
    private readonly cardTplMap = new Map<string, CardTemplate>();

    /**
     * Available note template dropdown options.
     */
    readonly noteTplOptions = signal<SelectDropdownOption[]>([]);
    /**
     * Available card template dropdown options for current note template.
     */
    readonly cardTplOptions = signal<SelectDropdownOption[]>([]);
    /**
     * Currently selected note template option.
     */
    readonly selectedNoteTpl = signal<SelectDropdownOption>(createEmptyOption());
    /**
     * Currently selected card template option.
     */
    readonly selectedCardTpl = signal<SelectDropdownOption>(createEmptyOption());
    /**
     * Current loaded note template detail.
     */
    readonly curNoteTpl = signal<NoteTemplate | null>(null);
    /**
     * Draft content for current card front.
     */
    readonly frontTpl = signal("");
    /**
     * Draft content for current card back.
     */
    readonly backTpl = signal("");
    /**
     * Draft css content for current note template.
     */
    readonly cssTpl = signal("");

    /**
     * Load note template refs and select preferred or first template.
     */
    async loadNoteTplRefs(preferredNoteTplId = ""): Promise<void> {
        const refs = await window.service.nt.getAllNoteTplRefs();
        const options = refs.map((ref) => ({
            label: ref.name,
            value: ref.id,
        }));
        this.noteTplRefMap.clear();
        options.forEach((option) => this.noteTplRefMap.set(option.value, option));
        this.noteTplOptions.set(options);

        const selected = this.noteTplRefMap.get(preferredNoteTplId) ?? options[0] ?? createEmptyOption();
        await this.selectNoteTpl(selected);
    }

    /**
     * Select note template and reload dependent card template state.
     */
    async selectNoteTpl(option: SelectDropdownOption): Promise<void> {
        this.selectedNoteTpl.set(option);
        if (!option.value) {
            this.resetNoteTplState();
            return;
        }

        const noteTpl = await window.service.nt.getNoteTplById(option.value);
        this.curNoteTpl.set(noteTpl);
        this.cssTpl.set(noteTpl?.css ?? "");
        this.reloadCardTplState(noteTpl);
    }

    /**
     * Select card template and sync editor draft.
     */
    selectCardTpl(option: SelectDropdownOption): void {
        this.selectedCardTpl.set(option);
        const cardTpl = this.cardTplMap.get(option.value);
        this.frontTpl.set(cardTpl?.front ?? "");
        this.backTpl.set(cardTpl?.back ?? "");
    }

    /**
     * Update draft content by active section.
     */
    updateDraft(section: "front" | "back" | "css", content: string): void {
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
     * Create card template under currently selected note template.
     */
    async createCardTpl(templateName: string) {
        const noteTplId = this.selectedNoteTpl().value;
        if (!noteTplId) {
            return {
                state: "not-found" as const,
            };
        }
        const result = await window.service.nt.createCardTpl(noteTplId, templateName);
        if (result.state === "success") {
            await this.selectNoteTpl(this.selectedNoteTpl());
            const target = this.cardTplOptions().find((option) => option.label === templateName);
            if (target) {
                this.selectCardTpl(target);
            }
        }
        return result;
    }

    /**
     * Delete currently selected card template.
     */
    async deleteSelectedCardTpl() {
        const noteTplId = this.selectedNoteTpl().value;
        const cardTplId = this.selectedCardTpl().value;
        if (!noteTplId || !cardTplId) {
            return {
                state: "not-found" as const,
            };
        }
        const result = await window.service.nt.deleteCardTpl(noteTplId, cardTplId);
        if (result.state === "success") {
            await this.selectNoteTpl(this.selectedNoteTpl());
        }
        return result;
    }

    /**
     * Create note template and refresh refs.
     */
    async createNoteTpl(templateName: string) {
        const result = await window.service.nt.createNoteTpl(templateName);
        if (result.state === "success") {
            await this.loadNoteTplRefs(this.selectedNoteTpl().value);
        }
        return result;
    }

    /**
     * Delete selected note template and refresh refs.
     */
    async deleteSelectedNoteTpl() {
        const selected = this.selectedNoteTpl();
        if (!selected.value) {
            return {
                state: "not-found" as const,
            };
        }
        const result = await window.service.nt.deleteNoteTpl(selected.value);
        if (result.state === "success") {
            await this.loadNoteTplRefs();
        }
        return result;
    }

    /**
     * Save current template draft.
     */
    async saveTemplateDraft() {
        const noteTpl = this.curNoteTpl();
        const noteTplId = this.selectedNoteTpl().value;
        const cardTplId = this.selectedCardTpl().value;
        if (!noteTpl || !noteTplId || !cardTplId) {
            return {
                state: "not-found" as const,
            };
        }

        const nextCardTpls = noteTpl.cardtpls.map((cardTpl) =>
            String(cardTpl.id) === cardTplId
                ? {
                    ...cardTpl,
                    front: this.frontTpl(),
                    back: this.backTpl(),
                }
                : cardTpl,
        );
        const nextNoteTpl: NoteTemplate = {
            ...noteTpl,
            css: this.cssTpl(),
            cardtpls: nextCardTpls,
        };
        const result = await window.service.nt.saveNoteTpl(noteTplId, nextNoteTpl);
        if (result.state === "success") {
            this.curNoteTpl.set(nextNoteTpl);
            this.cardTplMap.clear();
            nextCardTpls.forEach((cardTpl) => this.cardTplMap.set(String(cardTpl.id), cardTpl));
        }
        return result;
    }

    private reloadCardTplState(noteTpl: NoteTemplate | null): void {
        this.cardTplMap.clear();
        const cardTplOptions = noteTpl?.cardtpls.map((cardTpl) => {
            const value = String(cardTpl.id);
            this.cardTplMap.set(value, cardTpl);
            return {
                label: cardTpl.name,
                value,
            };
        }) ?? [];
        this.cardTplOptions.set(cardTplOptions);
        this.selectCardTpl(cardTplOptions[0] ?? createEmptyOption());
    }

    private resetNoteTplState(): void {
        this.curNoteTpl.set(null);
        this.cardTplMap.clear();
        this.cardTplOptions.set([]);
        this.selectCardTpl(createEmptyOption());
        this.cssTpl.set("");
    }
}
