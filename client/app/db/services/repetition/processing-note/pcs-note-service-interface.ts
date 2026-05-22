import { ProxyPropertyType } from "electron-ipc-cat/common";
import {
    ProcessingNote,
    ProcessingNoteCreationResult,
    ProcessingNoteRef,
    ProcessingNoteSaveResult,
} from "./pcs-note-types";

export interface IPcsNoteService {
    /**
     * Add a new processing note and return the creation state.
     * @param note processing note payload from renderer
     */
    addProcessingNote(note: PcsNote): Promise<PcsNoteCreationResult>;

    /**
     * Save current processing note content.
     * @param note processing note payload with existing id
     */
    saveProcessingNote(note: PcsNote): Promise<PcsNoteSaveResult>;

    /**
     * Save current processing note content and create cards in the target deck.
     * @param note processing note payload with existing id
     * @param deckId target deck id in hex string format
     */
    saveProcessingNoteToDeck(
        note: PcsNote,
        deckId: string,
    ): Promise<PcsNoteSaveToDeckResult>;

    /**
     * Get a processing note by its reference id.
     * @param noteId processing note id in hex string format
     */
    getProcessingNoteById(noteId: string): Promise<PcsNote | null>;

    /**
     * Get all processing note references.
     */
    getAllProcessingNoteRefs(): Promise<ProcessingNoteRef[]>;
}

export const PcsNoteServiceIPCDescriptor = {
    channel: "pcsNoteService",
    properties: {
        addProcessingNote: ProxyPropertyType.Function,
        saveProcessingNote: ProxyPropertyType.Function,
        getProcessingNoteById: ProxyPropertyType.Function,
        getAllProcessingNoteRefs: ProxyPropertyType.Function,
    },
};
