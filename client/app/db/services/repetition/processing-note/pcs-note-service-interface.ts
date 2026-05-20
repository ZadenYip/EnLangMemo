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
    addProcessingNote(note: ProcessingNote): Promise<ProcessingNoteCreationResult>;

    /**
     * Save current processing note content.
     * @param note processing note payload with existing id
     */
    saveProcessingNote(note: ProcessingNote): Promise<ProcessingNoteSaveResult>;

    /**
     * Get a processing note by its reference id.
     * @param noteId processing note id in hex string format
     */
    getProcessingNoteById(noteId: string): Promise<ProcessingNote | null>;

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
