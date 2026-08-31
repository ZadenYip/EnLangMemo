export interface NoteTplRef {
    id: string;
    name: string;
}

export interface NoteTemplate {
    /**
     * CSS content used by the fixed note template renderer.
     */
    css: string;
    /**
     * Fixed sort field business id, unix timestamp in milliseconds, e.g. 1778079239000.
     */
    sortFieldId: number;
    /**
     * Fixed field definitions used by notes created from this template.
     */
    fields: TemplateField[];
    /**
     * HTML content for the front side of the fixed presentation template.
     */
    front: string;
    /**
     * HTML content for the back side of the fixed presentation template.
     */
    back: string;
}

/**
 * Result of saving note template content.
 */
export type NoteTemplateSaveResult =
    | { state: "success"; templateId: string }
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

