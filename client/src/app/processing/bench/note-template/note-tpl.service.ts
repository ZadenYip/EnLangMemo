import { Injectable } from "@angular/core";
import {
    NoteTplRef,
    NoteTemplateCreationResult,
    NoteTemplateDeletionResult,
} from "@main/db/services/repetition/note/nt-service.types";

@Injectable({
    providedIn: "root",
})
export class NoteTplService {
    /**
     * Cached list for preserving display order.
     */
    private cachedNoteTpls: NoteTplRef[] = [];
    /**
     * Cached index for O(1) lookup by template id.
     */
    private cachedNoteTplMap = new Map<string, NoteTplRef>();

    /**
     * Load note templates from IPC service and refresh local cache.
     */
    async loadAllNoteTpls(): Promise<NoteTplRef[]> {
        const noteTpls = await window.service.nt.getAllNoteTpls();
        this.updateCache(noteTpls);
        return noteTpls;
    }

    /**
     * Create a note template through IPC service.
     */
    async createNoteTpl(templateName: string): Promise<NoteTemplateCreationResult> {
        return window.service.nt.createNoteTpl(templateName);
    }

    /**
     * Delete a note template through IPC service.
     */
    async deleteNoteTpl(templateId: string): Promise<NoteTemplateDeletionResult> {
        return window.service.nt.deleteNoteTpl(templateId);
    }

    /**
     * Get cached note template by id.
     */
    getNoteTplById(templateId: string): NoteTplRef | undefined {
        return this.cachedNoteTplMap.get(templateId);
    }

    /**
     * Get cached note templates list.
     */
    getCachedNoteTpls(): NoteTplRef[] {
        return this.cachedNoteTpls;
    }

    /**
     * Replace internal cache with fresh list data.
     */
    private updateCache(noteTpls: NoteTplRef[]): void {
        this.cachedNoteTpls = noteTpls;
        this.cachedNoteTplMap = new Map(noteTpls.map((noteTpl) => [noteTpl.id, noteTpl]));
    }
}
