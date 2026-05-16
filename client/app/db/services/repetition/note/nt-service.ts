import Logger from "electron-log/main";
import { eq } from "drizzle-orm";
import { bufferToHex, generateUUIDV7, hexToBuffer } from "@main/db/import/utils";
import { getRepDb } from "@main/db/db";
import { noteTypesTable } from "@main/db/schema/repetition/rep";
import { INoteTemplateService } from "./nt-service-interface";
import {
    CardTemplateCreationResult,
    NoteTplRef,
    NoteTemplate,
    NoteTemplateCreationResult,
    NoteTemplateSaveResult,
    TemplateDeletionResult,
} from "./nt-service.types";
import { genCardTpl, genNoteTpl } from "./nt-service-helper";


export class NoteTemplateService implements INoteTemplateService {
    /**
     * Create a new note template with a unique name.
     */
    async createNoteTpl(name: string): Promise<NoteTemplateCreationResult> {
        const existingTemplate =
            await getRepDb().query.noteTypesTable.findFirst({
                where: eq(noteTypesTable.name, name),
                columns: {
                    id: true,
                },
            });

        if (existingTemplate) {
            Logger.warn("Note template already exists:", name);
            return {
                state: "duplicate",
            };
        }

        const noteTemplate = genNoteTpl();

        Logger.info("Creating note template:", name);
        await getRepDb().insert(noteTypesTable).values({
            id: generateUUIDV7(),
            name,
            usn: -1,
            updatedAt: Date.now(),
            noteTemplate: noteTemplate,
        });
        Logger.info("Note template created:", name);

        return {
            state: "success",
            templateName: name,
        };
    }

    /**
     * Create a new card template under a note template.
     */
    async createCardTpl(noteTplId: string, templateName: string): Promise<CardTemplateCreationResult> {
        const targetId = hexToBuffer(noteTplId);
        const originNoteTpl = await getRepDb().query.noteTypesTable.findFirst({
            where: eq(noteTypesTable.id, targetId),
            columns: {
                noteTemplate: true,
            },
        });

        if (!originNoteTpl) {
            Logger.warn("Note template not found when creating card template:", noteTplId);
            return {
                state: "not-found",
            };
        }

        const hasDuplicateName = originNoteTpl.noteTemplate.cardtpls.some((cardTpl) => cardTpl.name === templateName);
        if (hasDuplicateName) {
            Logger.warn("Card template already exists:", templateName);
            return {
                state: "duplicate",
            };
        }

        const newCardTpl = genCardTpl(templateName);
        const newNoteTpl: NoteTemplate = {
            ...originNoteTpl.noteTemplate,
            cardtpls: [...originNoteTpl.noteTemplate.cardtpls, newCardTpl],
        };

        await getRepDb()
            .update(noteTypesTable)
            .set({
                usn: -1,
                updatedAt: Date.now(),
                noteTemplate: newNoteTpl,
            })
            .where(eq(noteTypesTable.id, targetId));

        Logger.info("Card template created:", {
            noteTplId,
            templateName,
        });
        return {
            state: "success",
            templateName,
        };
    }

    /**
     * Delete a card template under a note template.
     */
    async deleteCardTpl(noteTplId: string, cardTplId: string): Promise<TemplateDeletionResult> {
        const targetId = hexToBuffer(noteTplId);
        const originNoteTpl = await getRepDb().query.noteTypesTable.findFirst({
            where: eq(noteTypesTable.id, targetId),
            columns: {
                noteTemplate: true,
            },
        });

        if (!originNoteTpl) {
            Logger.warn("Note template not found when deleting card template:", noteTplId);
            return {
                state: "not-found",
            };
        }

        if (originNoteTpl.noteTemplate.cardtpls.length <= 1) {
            Logger.warn("Prevented deleting the last remaining card template", {
                noteTplId,
                cardTplId,
            });
            return {
                state: "last-one",
            };
        }

        const newCardTpls = originNoteTpl.noteTemplate.cardtpls.filter((cardTpl) => String(cardTpl.id) !== cardTplId);
        if (newCardTpls.length === originNoteTpl.noteTemplate.cardtpls.length) {
            Logger.warn("Card template not found when deleting:", {
                noteTplId,
                cardTplId,
            });
            return {
                state: "not-found",
            };
        }

        const newNoteTemplate: NoteTemplate = {
            ...originNoteTpl.noteTemplate,
            cardtpls: newCardTpls,
        };
        await getRepDb()
            .update(noteTypesTable)
            .set({
                updatedAt: Date.now(),
                noteTemplate: newNoteTemplate,
            })
            .where(eq(noteTypesTable.id, targetId));

        Logger.info("Card template deleted:", {
            noteTplId,
            cardTplId,
        });
        return {
            state: "success",
            templateId: cardTplId,
        };
    }

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
     * Save note template content by id.
     */
    async saveNoteTpl(templateId: string, noteTemplate: NoteTemplate): Promise<NoteTemplateSaveResult> {
        const targetId = hexToBuffer(templateId);
        const result = await getRepDb()
            .update(noteTypesTable)
            .set({
                updatedAt: Date.now(),
                noteTemplate,
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

    /**
     * Delete an existing note template by id.
     */
    async deleteNoteTpl(templateId: string): Promise<TemplateDeletionResult> {
        const existingTplIds = await getRepDb().query.noteTypesTable.findMany({
            columns: {
                id: true,
            },
            limit: 2,
        });

        if (existingTplIds.length <= 1) {
            Logger.warn("Prevented deleting the last remaining note template", {
                templateId,
            });
            return {
                state: "last-one",
            };
        }

        const targetId = hexToBuffer(templateId);
        const deletedRows = await getRepDb()
            .delete(noteTypesTable)
            .where(eq(noteTypesTable.id, targetId));

        if (deletedRows.changes === 0) {
            Logger.warn(
                "Note template not found when deleting:",
                templateId,
            );
            return {
                state: "not-found",
            };
        }

        Logger.info("Note template deleted:", templateId);
        return {
            state: "success",
            templateId,
        };
    }
}
