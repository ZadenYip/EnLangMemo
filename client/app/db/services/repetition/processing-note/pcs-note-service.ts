import Logger from "electron-log/main";
import { eq } from "drizzle-orm";
import { getRepDb } from "@main/db/db";
import { bufferToHex, generateUUIDV7, hexToBuffer } from "@main/db/import/utils";
import { processingNotesTable } from "@main/db/schema/repetition/rep";
import { ProcessingNote, ProcessingNoteRef } from "./pcs-note-types";
import { IPcsNoteService } from "./pcs-note-service-interface";

/**
 * Service for processing notes waiting in the bench pool.
 */
export class PcsNoteService implements IPcsNoteService {
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
     * Get a processing note by its reference id.
     */
    async getProcessingNoteById(noteId: string): Promise<ProcessingNote | null> {
        const rawNote = await getRepDb().query.processingNotesTable.findFirst({
            where: eq(processingNotesTable.id, hexToBuffer(noteId)),
        });

        if (!rawNote) {
            return null;
        }

        /** Parsed processing note fields stored as JSON text. */
        const fields = rawNote.fields
            ? JSON.parse(rawNote.fields) as ProcessingNote["fields"]
            : undefined;

        return {
            id: bufferToHex(rawNote.id),
            noteTplId: bufferToHex(rawNote.noteTypeId),
            senseId: rawNote.senseId ? bufferToHex(rawNote.senseId) : undefined,
            fields,
        };
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
