import Logger from "electron-log/main.js";
import { eq } from "drizzle-orm";
import { getRepDb } from "@main/db/db.js";
import { bufferToHex, generateUUIDV7, hexToBuffer } from "@main/db/import/utils.js";
import {
    decksTable,
    noteTypesTable,
    processingNotesTable,
} from "@main/db/schema/repetition/rep.js";
import { createCardFromPcsNote } from "@main/db/services/repetition/cards/card-service.js";
import {
    PcsNote,
    PcsNoteCreationResult,
    PcsNoteRef,
    PcsNoteSaveResult,
    PcsNoteSaveToDeckResult,
} from "./pcs-note-types.js";
import { EntityType } from "@enlangmemo/sync-api";
import { PendingLocalUsn } from "@main/sync/helper/usn.js";
import { upsertTombstone } from "@main/sync/pull/apply/common.js";

/**
 * Service for processing notes waiting in the bench pool.
 */
export class PcsNoteService {
    /**
     * Add a new processing note and return the creation state.
     */
    async addPcsNote(note: PcsNote): Promise<PcsNoteCreationResult> {
        if (!Array.isArray(note.fields) || note.fields.length === 0) {
            Logger.warn("Processing note creation failed: invalid fields", {
                noteTplId: note.noteTplId,
            });
            return {
                state: "invalid-fields",
            };
        }

        /** Note template id converted to database blob primary key. */
        const noteTypeId = hexToBuffer(note.noteTplId);
        /** Existing note template row used to validate foreign business state. */
        const noteType = await getRepDb().query.noteTypesTable.findFirst({
            where: eq(noteTypesTable.id, noteTypeId),
            columns: {
                noteTemplate: true,
            },
        });

        if (!noteType) {
            Logger.warn("Processing note creation failed: note template not found", {
                noteTplId: note.noteTplId,
            });
            return {
                state: "note-template-not-found",
            };
        }

        if (!this.hasValidTemplateFields(note, noteType.noteTemplate.fields)) {
            Logger.warn("Processing note creation failed: fields do not match note template", {
                noteTplId: note.noteTplId,
            });
            return {
                state: "invalid-fields",
            };
        }

        /** Generated processing note primary key. */
        const id = generateUUIDV7();
        /** Current timestamp used for created/updated metadata. */
        const now = Date.now();

        await getRepDb()
            .insert(processingNotesTable)
            .values({
                id,
                noteTypeId,
                usn: PendingLocalUsn,
                createdAt: now,
                updatedAt: now,
                senseId: note.senseId ?? null,
                fields: note.fields,
            });

        Logger.info("Processing note added:", {
            processingNoteId: bufferToHex(id),
            noteTplId: note.noteTplId,
        });

        return {
            state: "success",
        };
    }

    /**
     * Save current processing note content and create cards in the target deck.
     */
    async savePcsNoteToDeck(
        note: PcsNote,
        deckId: string,
    ): Promise<PcsNoteSaveToDeckResult> {
        /** Result of saving the latest processing note draft before card creation. */
        const saveResult = await this.savePcsNote(note);
        if (saveResult.state !== "success") {
            return saveResult;
        }

        /** Target deck row used by future note/card creation. */
        const deck = await getRepDb().query.decksTable.findFirst({
            where: eq(decksTable.id, hexToBuffer(deckId)),
            columns: {
                id: true,
                name: true,
            },
        });

        if (!deck) {
            Logger.warn("Processing note save-to-deck failed: deck not found", {
                noteId: note.id,
                deckId,
            });
            return {
                state: "deck-not-found",
            };
        }

        /** Note template row used to create the fixed single card. */
        const noteType = await getRepDb().query.noteTypesTable.findFirst({
            where: eq(noteTypesTable.id, hexToBuffer(note.noteTplId)),
            columns: {
                noteTemplate: true,
                usn: true,
            },
        });

        if (!noteType) {
            Logger.warn("Processing note save-to-deck failed: note template not found", {
                noteId: note.id,
                noteTplId: note.noteTplId,
            });
            return {
                state: "note-template-not-found",
            };
        }

        const processingNote = await getRepDb().query.processingNotesTable.findFirst({
            where: eq(processingNotesTable.id, hexToBuffer(note.id)),
            columns: {
                usn: true,
            },
        });

        if (!processingNote) {
            Logger.error("Processing note save-to-deck failed: note not found", {
                noteId: note.id,
            });
            return {
                state: "not-found",
            };
        }

        getRepDb().transaction((tx) => {
            createCardFromPcsNote(
                note,
                deck.id,
                noteType.noteTemplate,
                tx,
            );
            upsertTombstone(tx, EntityType.PROCESSING_NOTE, hexToBuffer(note.id), Date.now());
            tx.delete(processingNotesTable)
                .where(eq(processingNotesTable.id, hexToBuffer(note.id)))
                .run();
        });

        Logger.info("Processing note saved, card created, and processing note deleted:", {
            noteId: note.id,
            deckId,
            deckName: deck.name,
        });

        return {
            state: "success",
        };
    }

    /**
     * Save current processing note content.
     */
    async savePcsNote(note: PcsNote): Promise<PcsNoteSaveResult> {
        /** Note template id converted to database blob primary key. */
        const noteTypeId = hexToBuffer(note.noteTplId);
        /** Existing note template row used to validate processing note fields. */
        const noteType = await getRepDb().query.noteTypesTable.findFirst({
            where: eq(noteTypesTable.id, noteTypeId),
            columns: {
                noteTemplate: true,
            },
        });

        if (!noteType) {
            Logger.warn("Processing note save failed: note template not found", {
                noteTplId: note.noteTplId,
                noteId: note.id,
            });
            return {
                state: "note-template-not-found",
            };
        }

        if (!this.hasValidTemplateFields(note, noteType.noteTemplate.fields)) {
            Logger.warn("Processing note save failed: fields do not match note template", {
                noteTplId: note.noteTplId,
                noteId: note.id,
            });
            return {
                state: "invalid-fields",
            };
        }

        const result = await getRepDb()
            .update(processingNotesTable)
            .set({
                usn: PendingLocalUsn,
                updatedAt: Date.now(),
                fields: note.fields,
            })
            .where(eq(processingNotesTable.id, hexToBuffer(note.id)));

        if (result.changes === 0) {
            Logger.warn("Processing note save failed: note not found", {
                noteId: note.id,
            });
            return {
                state: "not-found",
            };
        }

        Logger.info("Processing note saved:", {
            noteId: note.id,
        });
        return {
            state: "success",
        };
    }

    /**
     * Check processing note fields cover exactly all fields defined by the note template.
     */
    private hasValidTemplateFields(
        note: PcsNote,
        templateFields: { id: number }[],
    ): boolean {
        const expectedFieldIds = new Set(templateFields.map((field) => String(field.id)));
        const actualFieldIds = new Set(note.fields.map((field) => field.id));

        if (actualFieldIds.size !== note.fields.length) {
            return false;
        }
        if (actualFieldIds.size !== expectedFieldIds.size) {
            return false;
        }

        return [...expectedFieldIds].every((fieldId) => actualFieldIds.has(fieldId));
    }

    /**
     * Get a processing note by its reference id.
     */
    async getPcsNoteById(noteId: string): Promise<PcsNote | null> {
        const rawNote = await getRepDb().query.processingNotesTable.findFirst({
            where: eq(processingNotesTable.id, hexToBuffer(noteId)),
        });

        if (!rawNote) {
            return null;
        }

        return {
            id: bufferToHex(rawNote.id),
            noteTplId: bufferToHex(rawNote.noteTypeId),
            senseId: rawNote.senseId ?? undefined,
            fields: rawNote.fields,
        };
    }

    /**
     * Get all processing note references.
     */
    async getAllPcsNoteRefs(): Promise<PcsNoteRef[]> {
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
