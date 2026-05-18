import Logger from "electron-log/main";
import { getRepDb } from "@main/db/db";
import { bufferToHex, generateUUIDV7, hexToBuffer } from "@main/db/import/utils";
import { processingNotesTable } from "@main/db/schema/repetition/rep";
import { ProcessingNote, ProcessingNoteRef } from "./dic-nt-adding-types";
import { IDicNoteAddingService } from "./dic-nt-adding-service-interface";

/**
 * Service for dictionary-created processing notes.
 */
export class DicNoteAddingService implements IDicNoteAddingService {
    /**
     * Add a new processing note and return its reference id.
     */
    async addProcessingNote(note: ProcessingNote): Promise<ProcessingNoteRef> {
        const id = generateUUIDV7();
        const now = Date.now();

        await getRepDb()
            .insert(processingNotesTable)
            .values({
                id,
                noteTypeId: hexToBuffer(note.noteTplId),
                usn: -1,
                createdAt: now,
                updatedAt: now,
                senseId: note.senseId ? hexToBuffer(note.senseId) : null,
                fields: note.fields ? JSON.stringify(note.fields) : null,
            });

        Logger.info("Processing note added:", {
            processingNoteId: bufferToHex(id),
            noteTplId: note.noteTplId,
        });

        const result: ProcessingNoteRef = {
            id: bufferToHex(id),
        };

        return result;
    }

    /**
     * Get all processing note references.
     */
    async getAllProcessingNoteRefs(): Promise<ProcessingNoteRef[]> {
        /** Raw processing note rows containing only primary keys. */
        const rawProcessingNotes =
            await getRepDb().query.processingNotesTable.findMany({
                columns: {
                    id: true,
                },
            });

        return rawProcessingNotes.map((note) => ({
            id: bufferToHex(note.id),
        }));
    }
}
