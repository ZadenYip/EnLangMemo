import Logger from "electron-log/main";
import { eq } from "drizzle-orm";
import { bufferToHex, generateUUIDV7, hexToBuffer } from "@main/db/import/utils";
import { getRepDb } from "@main/db/db";
import { noteTypesTable } from "@main/db/schema/repetition/rep";
import { INoteTemplateService } from "./nt-service-interface";
import { NoteTplRef, NoteTemplateCreationResult, NoteTemplateDeletionResult } from "./nt-service.types";
import { genNoteTpl } from "./nt-service-helper";


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

    async getAllNoteTpls(): Promise<NoteTplRef[]> {
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
     * Delete an existing note template by id.
     */
    async deleteNoteTpl(templateId: string): Promise<NoteTemplateDeletionResult> {
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
