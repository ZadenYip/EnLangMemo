import {
    PcsNote,
    PcsNoteCreationResult,
    PcsNoteRef,
    PcsNoteSaveResult,
    PcsNoteSaveToDeckResult,
} from "./pcs-note-types.js";
import { IPcsNoteService } from "./pcs-note-service-interface.js";
import { PcsNoteService } from "./pcs-note-service.js";

/**
 * IPC-facing processing note service facade.
 */
export class PcsNoteIpcService implements IPcsNoteService {
    /**
     * Internal processing note business service.
     */
    private readonly pcsNoteService = new PcsNoteService();

    /**
     * Add a processing note.
     */
    addPcsNote(note: PcsNote): Promise<PcsNoteCreationResult> {
        return this.pcsNoteService.addPcsNote(note);
    }

    /**
     * Save current processing note content.
     */
    savePcsNote(note: PcsNote): Promise<PcsNoteSaveResult> {
        return this.pcsNoteService.savePcsNote(note);
    }

    /**
     * Save current processing note content and create cards in the target deck.
     */
    savePcsNoteToDeck(
        note: PcsNote,
        deckId: string,
    ): Promise<PcsNoteSaveToDeckResult> {
        return this.pcsNoteService.savePcsNoteToDeck(note, deckId);
    }

    /**
     * Get a processing note by id.
     */
    getPcsNoteById(noteId: string): Promise<PcsNote | null> {
        return this.pcsNoteService.getPcsNoteById(noteId);
    }

    /**
     * Get all processing note references.
     */
    getAllPcsNoteRefs(): Promise<PcsNoteRef[]> {
        return this.pcsNoteService.getAllPcsNoteRefs();
    }
}
