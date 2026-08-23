import Logger from "electron-log/main.js";
import { eq } from "drizzle-orm";
import { bufferToHex, hexToBuffer } from "@main/db/import/utils.js";
import { getRepDb } from "@main/db/db.js";
import { noteTypesTable } from "@main/db/schema/repetition/rep.js";
import { INoteTplService } from "./nt-tpl-service-interface.js";
import {
    NoteTplRef,
    NoteTemplate,
    NoteTemplateSaveResult,
} from "./nt-tpl-service-types.js";


export class NoteTplService implements INoteTplService {
    async getAllNoteTplRefs(): Promise<NoteTplRef[]> {
        const rawTpls = await getRepDb().query.noteTypesTable.findMany({
            columns: {
                id: true,
                name: true,
            },
        });

        const tpls: NoteTplRef[] = rawTpls.map((raw) => ({
            id: bufferToHex(raw.id),
            name: raw.name,
        }));

        return tpls;
    }

    /**
     * Get note template detail by id.
     */
    async getNoteTplById(templateId: string): Promise<NoteTemplate | null> {
        const targetId = hexToBuffer(templateId);
        const rawTpl = await getRepDb().query.noteTypesTable.findFirst({
            where: eq(noteTypesTable.id, targetId),
            columns: {
                noteTemplate: true,
            },
        });

        return rawTpl?.noteTemplate ?? null;
    }

    /**
     * Save editable note template presentation content by id.
     */
    async saveNoteTpl(templateId: string, noteTpl: NoteTemplate): Promise<NoteTemplateSaveResult> {
        const targetId = hexToBuffer(templateId);
        const existing = await getRepDb().query.noteTypesTable.findFirst({
            where: eq(noteTypesTable.id, targetId),
            columns: {
                noteTemplate: true,
            },
        });

        if (!existing) {
            Logger.warn("Note template not found when saving:", templateId);
            return {
                state: "not-found",
            };
        }

        /** Template payload that preserves fixed fields and only updates editable presentation content. */
        const nextNoteTpl: NoteTemplate = {
            ...existing.noteTemplate,
            css: noteTpl.css,
            front: noteTpl.front,
            back: noteTpl.back,
        };

        const result = await getRepDb()
            .update(noteTypesTable)
            .set({
                updatedAt: Date.now(),
                noteTemplate: nextNoteTpl,
            })
            .where(eq(noteTypesTable.id, targetId));

        if (result.changes === 0) {
            Logger.warn("Note template not found when saving:", templateId);
            return {
                state: "not-found",
            };
        }

        Logger.info("Note template saved:", templateId);
        return {
            state: "success",
            templateId,
        };
    }
}
