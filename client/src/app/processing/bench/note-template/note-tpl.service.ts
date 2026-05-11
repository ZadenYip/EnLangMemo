import { Injectable } from "@angular/core";
import {
    NoteTplRef,
    NoteTemplate,
    NoteTemplateCreationResult,
    NoteTemplateDeletionResult,
    CardTemplate,
} from "@main/db/services/repetition/note/nt-service.types";
import { SelectDropdownOption } from "@render/shared/components/select-dropdown/select-dropdown.component";

export interface NoteTplLoadedState {
    noteTplOpts: SelectDropdownOption[];
    selectedNoteTplOpt: SelectDropdownOption;
    noteTplDetail: NoteTemplate | null;
    cardTplOpts: SelectDropdownOption[];
    selectedCardTplOpt: SelectDropdownOption;
    cardTplMap: Map<string, CardTemplate>;
}

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
            ? new Map(noteTpl.cardtpls.map((cardTpl) => [cardTpl.id, cardTpl]))
            : new Map();
        this.curNoteTpl = noteTpl;
        return noteTpl;
    }

    public getNoteTpl(): NoteTemplate | null {
        return this.curNoteTpl;
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
     * Delete a note template through IPC service.
     */
    async deleteNoteTpl(templateId: string): Promise<NoteTemplateDeletionResult> {
        const result = await window.service.nt.deleteNoteTpl(templateId);
        await this.loadAllNoteTplRefs();
        return result;
    }

}
