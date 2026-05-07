import Logger from "electron-log/main";
import { eq } from "drizzle-orm";
import { generateUUIDV7 } from "@main/db/import/utils";
import { getRepDb } from "@main/db/db";
import { noteTypesTable } from "@main/db/schema/repetition/rep";
import { INoteTemplateService } from "./nt-service-interface";
import { NamedNoteTpl, NoteTemplateCreationResult } from "./nt-service.types";
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

    async getAllNoteTpls(): Promise<NamedNoteTpl[]> {
        const templates: NamedNoteTpl[] = await getRepDb().query.noteTypesTable.findMany({
            columns: {
                name: true,
                noteTemplate: true,
            },
        });
        
        return templates;
    }
}