export interface PcsNoteRef {
    id: string;
}

export type PcsNoteCreationResult =
    | {
        state: "success";
    }
    | {
        state: "invalid-fields" | "note-template-not-found";
    };

export type PcsNoteSaveResult =
    | {
        state: "success";
    }
    | {
        state: "not-found" | "invalid-fields" | "note-template-not-found";
    };

export type PcsNoteSaveToDeckResult =
    | {
        state: "success";
    }
    | {
        state: "not-found" | "invalid-fields" | "note-template-not-found" | "deck-not-found";
    };

export interface PcsNote {
    id: string;
    noteTplId: string;
    senseId?: string;
    fields: NoteField[];
}

export interface NoteField {
    id: string;
    value: string;
}
