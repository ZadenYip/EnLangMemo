export interface ProcessingNoteRef {
    id: string;
}

export type ProcessingNoteCreationResult =
    | {
        state: "success";
    }
    | {
        state: "invalid-fields" | "note-template-not-found";
    };

export type ProcessingNoteSaveResult =
    | {
        state: "success";
    }
    | {
        state: "not-found" | "invalid-fields" | "note-template-not-found";
    };

export interface ProcessingNote {
    id: string;
    noteTplId: string;
    senseId?: string;
    fields: NoteField[];
}

export interface NoteField {
    id: string;
    value: string;
}
