import { Injectable, signal } from "@angular/core";
import { CardTemplate, NoteTemplate } from "@main/db/services/repetition/note-template/nt-tpl-service.types";
import {
    createEmptyOption,
    SelectDropdownOption,
} from "@render/shared/components/select-dropdown/select-dropdown.component";
import Logger from "electron-log/renderer";

@Injectable()
export class BenchStateService {
    private readonly noteTplRefMap = new Map<string, SelectDropdownOption>();
    private readonly cardTplMap = new Map<string, CardTemplate>();

    /**
     * Whether template-related async operation is running.
     */
    readonly isBusy = signal(false);

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
     * Load note template refs and select preferred or first template.
     */
    async loadNoteTplRefs(preferredNoteTplId = ""): Promise<void> {
        if (!this.beginBusy()) {
            return;
        }
        try {
            await this.loadNoteTplRefsCore(preferredNoteTplId);
        } finally {
            this.endBusy();
        }
    }

    /**
     * Select note template and reload dependent card template state.
     */
    async selectNoteTpl(option: SelectDropdownOption): Promise<void> {
        if (!this.beginBusy()) {
            return;
        }
        try {
            await this.selectNoteTplCore(option);
        } finally {
            this.endBusy();
        }
    }

    /**
     * Select card template for current note template.
     */
    selectCardTpl(option: SelectDropdownOption): void {
        this.selectedCardTpl.set(option);
    }

    /**
     * Create card template under currently selected note template.
     */
    async createCardTpl(templateName: string) {
        if (!this.beginBusy()) {
            return {
                state: "busy" as const,
            };
        }
        try {
            const noteTplId = this.selectedNoteTpl().value;
            if (!noteTplId) {
                return {
                    state: "not-found" as const,
                };
            }
            const result = await window.service.ntTpl.createCardTpl(noteTplId, templateName);
            if (result.state === "success") {
                await this.selectNoteTplCore(this.selectedNoteTpl());
                const target = this.cardTplOptions().find((option) => option.label === templateName);
                if (target) {
                    this.selectCardTpl(target);
                }
            }
            return result;
        } finally {
            this.endBusy();
        }
    }

    /**
     * Delete currently selected card template.
     */
    async deleteSelectedCardTpl() {
        if (!this.beginBusy()) {
            return {
                state: "busy" as const,
            };
        }
        try {
            const noteTplId = this.selectedNoteTpl().value;
            const cardTplId = this.selectedCardTpl().value;
            if (!noteTplId || !cardTplId) {
                return {
                    state: "not-found" as const,
                };
            }
            const result = await window.service.ntTpl.deleteCardTpl(noteTplId, cardTplId);
            if (result.state === "success") {
                await this.selectNoteTplCore(this.selectedNoteTpl());
            }
            return result;
        } finally {
            this.endBusy();
        }
    }

    /**
     * Create note template and refresh refs.
     */
    async createNoteTpl(templateName: string) {
        if (!this.beginBusy()) {
            return {
                state: "busy" as const,
            };
        }
        try {
            const result = await window.service.ntTpl.createNoteTpl(templateName);
            if (result.state === "success") {
                await this.loadNoteTplRefsCore(this.selectedNoteTpl().value);
            }
            return result;
        } finally {
            this.endBusy();
        }
    }

    /**
     * Delete selected note template and refresh refs.
     */
    async deleteSelectedNoteTpl() {
        if (!this.beginBusy()) {
            return {
                state: "busy" as const,
            };
        }
        try {
            const selected = this.selectedNoteTpl();
            if (!selected.value) {
                return {
                    state: "not-found" as const,
                };
            }
            const result = await window.service.ntTpl.deleteNoteTpl(selected.value);
            if (result.state === "success") {
                await this.loadNoteTplRefsCore();
            }
            return result;
        } finally {
            this.endBusy();
        }
    }

    /**
     * Replace current note template cache after a successful template save.
     */
    replaceCurNoteTpl(noteTpl: NoteTemplate): void {
        this.curNoteTpl.set(noteTpl);
        this.reloadCardTplState(noteTpl, this.selectedCardTpl().value);
    }

    /**
     * Try to lock template operations synchronously before async work starts.
     */
    beginBusy(): boolean {
        if (this.isBusy()) {
            Logger.warn("Operation failed: busy，logically should not happen");
            return false;
        }
        this.isBusy.set(true);
        return true;
    }

    /**
     * Release template operation lock after async work completes.
     */
    endBusy(): void {
        this.isBusy.set(false);
    }

    private async loadNoteTplRefsCore(preferredNoteTplId = ""): Promise<void> {
        const refs = await window.service.ntTpl.getAllNoteTplRefs();
        const options = refs.map((ref) => ({
            label: ref.name,
            value: ref.id,
        }));
        this.noteTplRefMap.clear();
        options.forEach((option) => this.noteTplRefMap.set(option.value, option));
        this.noteTplOptions.set(options);

        const selected = this.noteTplRefMap.get(preferredNoteTplId) ?? options[0] ?? createEmptyOption();
        await this.selectNoteTplCore(selected);
    }

    private async selectNoteTplCore(option: SelectDropdownOption): Promise<void> {
        this.selectedNoteTpl.set(option);
        if (!option.value) {
            this.resetNoteTplState();
            return;
        }

        const noteTpl = await window.service.ntTpl.getNoteTplById(option.value);
        this.curNoteTpl.set(noteTpl);
        this.reloadCardTplState(noteTpl);
    }

    private reloadCardTplState(noteTpl: NoteTemplate | null, preferredCardTplId = ""): void {
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
        const selected = cardTplOptions.find((option) => option.value === preferredCardTplId) ?? cardTplOptions[0] ?? createEmptyOption();
        this.selectCardTpl(selected);
    }

    private resetNoteTplState(): void {
        this.curNoteTpl.set(null);
        this.cardTplMap.clear();
        this.cardTplOptions.set([]);
        this.selectCardTpl(createEmptyOption());
    }
}
