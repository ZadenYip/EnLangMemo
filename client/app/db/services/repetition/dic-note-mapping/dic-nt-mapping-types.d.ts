
/**
 * Global dictionary note creation mapping.
 */
export interface DicNoteMapping {
    /**
     * Dictionary source fields mapped to TemplateField business ids.
     */
    fieldMap: DicNoteFieldMapping;
}

export interface DicNoteMapWithNoteType {
    /**
     * Business id of the note type to which the mapping applies.
     */
    noteTypeId: string;
    dicNoteMapping: DicNoteMapping;
}

/**
 * Dictionary fields that can be written into a note.
 * number is used for NoteTpl field id
 */
export interface DicNoteFieldMapping {
    /**
     * TemplateField business id for source word text.
     */
    wordFieldId: number;

    /**
     * TemplateField business id for phonetic text.
     */
    phoneticFieldId?: number;

    /**
     * TemplateField business id for context sentence text.
     */
    contextFieldId?: number;

    /**
     * TemplateField business id for source definition text.
     */
    srcDefFieldId: number;

    /**
     * TemplateField business id for target definition text.
     */
    tgtDefFieldId?: number;
}

