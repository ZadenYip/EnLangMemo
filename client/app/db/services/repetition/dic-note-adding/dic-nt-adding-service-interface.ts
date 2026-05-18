import { ProxyPropertyType } from "electron-ipc-cat/common";
import { ProcessingNote, ProcessingNoteRef } from "./dic-nt-adding-types";

export interface IDicNoteAddingService {
    /**
     * Add a new processing note and return its reference id.
     * @param note processing note payload from renderer
     */
    addProcessingNote(note: ProcessingNote): Promise<ProcessingNoteRef>;

    /**
     * Get all processing note references.
     */
    getAllProcessingNoteRefs(): Promise<ProcessingNoteRef[]>;
}

export const DicNoteAddingServiceIPCDescriptor = {
    channel: "dicNoteAddingService",
    properties: {
        addProcessingNote: ProxyPropertyType.Function,
        getAllProcessingNoteRefs: ProxyPropertyType.Function,
    },
};
