import { ProxyPropertyType } from "electron-ipc-cat/common";
import { ProcessingNote, ProcessingNoteRef } from "./pcs-note-types";

export interface IPcsNoteService {
    /**
     * Add a new processing note and return its reference id.
     * @param note processing note payload from renderer
     */
    addProcessingNote(note: ProcessingNote): Promise<ProcessingNoteRef>;

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
        getProcessingNoteById: ProxyPropertyType.Function,
        getAllProcessingNoteRefs: ProxyPropertyType.Function,
    },
};
