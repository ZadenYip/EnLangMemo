import {
    ProcessingNote,
    ProcessingNoteCreationResult,
    ProcessingNoteRef,
    ProcessingNoteSaveResult,
    ProcessingNoteSaveToDeckResult,
} from "./pcs-note-types";
import { IPcsNoteService } from "./pcs-note-service-interface";
import { PcsNoteService } from "./pcs-note-service";

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
    addProcessingNote(note: ProcessingNote): Promise<ProcessingNoteCreationResult> {
        return this.pcsNoteService.addProcessingNote(note);
    }

    /**
     * Save current processing note content.
     */
    saveProcessingNote(note: ProcessingNote): Promise<ProcessingNoteSaveResult> {
        return this.pcsNoteService.saveProcessingNote(note);
    }

    /**
     * Save current processing note content and create cards in the target deck.
     */
    saveProcessingNoteToDeck(
        note: ProcessingNote,
        deckId: string,
    ): Promise<ProcessingNoteSaveToDeckResult> {
        return this.pcsNoteService.saveProcessingNoteToDeck(note, deckId);
    }

    /**
     * Get a processing note by id.
     */
    getProcessingNoteById(noteId: string): Promise<ProcessingNote | null> {
        return this.pcsNoteService.getProcessingNoteById(noteId);
    }

    /**
     * Get all processing note references.
     */
    getAllProcessingNoteRefs(): Promise<ProcessingNoteRef[]> {
        return this.pcsNoteService.getAllProcessingNoteRefs();
    }
}
