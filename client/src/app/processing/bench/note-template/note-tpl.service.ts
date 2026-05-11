import { Injectable } from "@angular/core";
import {
    CardTemplateCreationResult,
    NoteTplRef,
    NoteTemplate,
    NoteTemplateCreationResult,
    TemplateDeletionResult,
    CardTemplate,
} from "@main/db/services/repetition/note/nt-service.types";
import { SelectDropdownOption } from "@render/shared/components/select-dropdown/select-dropdown.component";

@Injectable()
export class NoteTplService {
    /**
     * Cached index for O(1) lookup by template id.
     */
    private cachedNoteTplMap = new Map<string, NoteTplRef>();
    /**
     * Cached card-template lookup map for the last loaded note template detail.
     */
    private cachedCardTplMap = new Map<string, CardTemplate>();
    private curNoteTpl: NoteTemplate | null = null;
    private curNoteTplId = "";

    constructor() {
        void this.loadAllNoteTplRefs();
    }

    /**
     * Load note templates from IPC service and refresh local cache.
     */
    async loadAllNoteTplRefs(noteTplId = ""): Promise<NoteTplRef[]> {
        const noteTpls = await window.service.nt.getAllNoteTplRefs();
        this.updateNoteTplCache(noteTpls);
        const selectedNoteTpl = this.cachedNoteTplMap.get(noteTplId);
        if (selectedNoteTpl) {
            await this.loadNoteTplById(noteTplId);
        } else {
            await this.loadNoteTplById(noteTpls[0].id ?? "");
        }
        return noteTpls;
    }

    /**
     * Replace internal cache with fresh list data.
     */
    private updateNoteTplCache(noteTpls: NoteTplRef[]): void {
        this.cachedNoteTplMap = new Map(noteTpls.map((noteTpl) => [noteTpl.id, noteTpl]));
    }

    /**
     * load note template and cached NoteTemplate.
     */
    public async loadNoteTplById(templateId: string): Promise<NoteTemplate | null> {
        const noteTpl = await window.service.nt.getNoteTplById(templateId);
        this.cachedCardTplMap = noteTpl
            ? new Map(noteTpl.cardtpls.map((cardTpl) => [String(cardTpl.id), cardTpl]))
            : new Map();
        this.curNoteTpl = noteTpl;
        this.curNoteTplId = noteTpl ? templateId : "";
        return noteTpl;
    }

    public getNoteTpl(): NoteTemplate | null {
        return this.curNoteTpl;
    }

    /**
     * Get card-template options for current loaded note template.
     */
    public getCardTplOptions(): SelectDropdownOption[] {
        return Array.from(this.cachedCardTplMap.values()).map((cardTpl) => ({
            label: cardTpl.name,
            value: String(cardTpl.id),
        }));
    }

    /**
     * Get card template by id from cache.
     */
    public getCardTplById(cardTplId: string): CardTemplate | null {
        return this.cachedCardTplMap.get(cardTplId) ?? null;
    }

    /**
     * Get NoteTmplRef by id from local cache.
     */
    public getNoteTplRefById(templateId: string): NoteTplRef | null {
        const noteTplRef = this.cachedNoteTplMap.get(templateId);
        return noteTplRef || null;
    }

    /**
     * Create a note template through IPC service.
     */
    async createNoteTpl(templateName: string): Promise<NoteTemplateCreationResult> {
        const result = await window.service.nt.createNoteTpl(templateName);
        await this.loadAllNoteTplRefs();
        return result;
    }

    /**
     * Create a card template under current selected note template.
     */
    async createCardTpl(templateName: string): Promise<CardTemplateCreationResult> {
        if (!this.curNoteTplId) {
            return {
                state: "not-found",
            };
        }
        const result = await window.service.nt.createCardTpl(this.curNoteTplId, templateName);
        if (result.state === "success") {
            await this.loadNoteTplById(this.curNoteTplId);
        }
        return result;
    }

    /**
     * Delete card template under current selected note template.
     */
    async deleteCardTpl(cardTplId: string): Promise<TemplateDeletionResult> {
        if (!this.curNoteTplId) {
            return {
                state: "not-found",
            };
        }
        const result = await window.service.nt.deleteCardTpl(this.curNoteTplId, cardTplId);
        if (result.state === "success") {
            await this.loadNoteTplById(this.curNoteTplId);
        }
        return result;
    }

    /**
     * Delete a note template through IPC service.
     */
    async deleteNoteTpl(templateId: string): Promise<TemplateDeletionResult> {
        const result = await window.service.nt.deleteNoteTpl(templateId);
        await this.loadAllNoteTplRefs();
        return result;
    }

}
