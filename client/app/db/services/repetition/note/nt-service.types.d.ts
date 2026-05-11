export interface NoteTplRef {
    id: string;
    name: string;
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
    | { state: "duplicate" };

/**
 * Result of creating a new card template under a note template.
 */
export type CardTemplateCreationResult =
    | { state: "success"; templateName: string }
    | { state: "duplicate" }
    | { state: "not-found" };

/**
 * Result of deleting a template entity.
 */
export type TemplateDeletionResult =
    | { state: "success"; templateId: string }
    | { state: "last-one" }
    | { state: "not-found" };

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
    name: string;
    /**
     * HTML content for the front side of the card.
     */
    front: string;
    /**
     * HTML content for the back side of the card.
     */
    back: string;
}
