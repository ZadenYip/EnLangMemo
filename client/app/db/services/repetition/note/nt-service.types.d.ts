export interface NamedNoteTpl {
    name: string;
    noteTemplate: NoteTemplate;
}

export interface NoteTemplate {
    /**
     * css content for the note template shared by all card templates.
     */
    css: string;
    /**
     * business id, unix timestamp in milliseconds, e.g. 1778079239000
     */
    sortField: number;
    fields: TemplateField[];
    cardtpls: CardTemplate[];
}

/**
 * Result of creating a new note template.
 */
export type NoteTemplateCreationResult =
    | { state: "success"; templateName: string }
    | { state: "duplicate" }
    | { state: "error"; errorMessage: string };

export interface TemplateField {
    /**
     * unix timestamp in milliseconds, e.g. 1778079239000
     * bussiness id
     */
    id: number;
    /**
     * The name of the field
     */
    name: string;
}

export interface CardTemplate {
    /**
     * unix timestamp in milliseconds, e.g. 1778079239000
     * bussiness id 
     */
    id: number;
    /**
     * HTML content for the front side of the card.
     */
    front: string;
    /**
     * HTML content for the back side of the card.
     */
    back: string;
}