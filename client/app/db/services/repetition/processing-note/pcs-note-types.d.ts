export interface ProcessingNoteRef {
    id: string;
}

export interface ProcessingNote {
    id?: string;
    noteTplId: string;
    senseId?: string;
    fields?: NoteField[];
}

export interface NoteField {
    id: string;
    value: string;
}
