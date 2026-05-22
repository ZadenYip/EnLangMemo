import { ProxyPropertyType } from "electron-ipc-cat/common";
import {
    PcsNote,
    PcsNoteCreationResult,
    PcsNoteRef,
    PcsNoteSaveResult,
    PcsNoteSaveToDeckResult,
} from "./pcs-note-types";

export interface IPcsNoteService {
    /**
     * Add a new processing note and return the creation state.
     * @param note processing note payload from renderer
     */
    addPcsNote(note: PcsNote): Promise<PcsNoteCreationResult>;

    /**
     * Save current processing note content.
     * @param note processing note payload with existing id
     */
    savePcsNote(note: PcsNote): Promise<PcsNoteSaveResult>;

    /**
     * Save current processing note content and create cards in the target deck.
     * @param note processing note payload with existing id
     * @param deckId target deck id in hex string format
     */
    savePcsNoteToDeck(
        note: PcsNote,
        deckId: string,
    ): Promise<PcsNoteSaveToDeckResult>;

    /**
     * Get a processing note by its reference id.
     * @param noteId processing note id in hex string format
     */
    getPcsNoteById(noteId: string): Promise<PcsNote | null>;

    /**
     * Get all processing note references.
     */
    getAllPcsNoteRefs(): Promise<PcsNoteRef[]>;
}

export const PcsNoteServiceIPCDescriptor = {
    channel: "pcsNoteService",
    properties: {
        addPcsNote: ProxyPropertyType.Function,
        savePcsNote: ProxyPropertyType.Function,
        savePcsNoteToDeck: ProxyPropertyType.Function,
        getPcsNoteById: ProxyPropertyType.Function,
        getAllPcsNoteRefs: ProxyPropertyType.Function,
    },
};
