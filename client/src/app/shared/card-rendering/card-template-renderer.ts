/**
 * Field value used when rendering a card template.
 */
export interface CardRenderField {
    /**
     * Field name referenced by template placeholders, for example {{Word}}.
     */
    name: string;
    /**
     * Field value injected into the rendered card HTML.
     */
    value: string;
}

/**
 * Input needed to render a complete card iframe document.
 */
export interface CardDocRenderInput {
    /**
     * Shared CSS from the note template.
     */
    css: string;
    /**
     * Front or back card template HTML.
     */
    template: string;
    /**
     * Field values keyed by note template field name.
     */
    fields: CardRenderField[];
}

/**
 * Opening braces used by field tags.
 */
const FIELD_TAG_OPEN = String.raw`\{\{\s*`;

/**
 * Closing braces used by field tags.
 */
const FIELD_TAG_CLOSE = String.raw`\s*\}\}`;

/**
 * Opening braces and marker used by conditional field tags.
 */
const FIELD_CONDITION_OPEN = String.raw`\{\{#\s*`;

/**
 * Opening braces and marker used by conditional field closing tags.
 */
const FIELD_CONDITION_CLOSE_OPEN = String.raw`\{\{\/\s*`;

/**
 * Captures a normal placeholder field name and skips condition tags.
 */
const PLACEHOLDER_FIELD_NAME = String.raw`([^#/][^}]*?)`;

/**
 * Captures a condition field name after {{#.
 */
const CONDITIONAL_FIELD_NAME = String.raw`(?<conditionFieldName>[^}]+?)`;

/**
 * Matches the same condition field name captured by the opening tag.
 */
const SAME_CONDITIONAL_FIELD_NAME = String.raw`\k<conditionFieldName>`;

/**
 * Captures condition block content across multiple lines.
 */
const CONDITIONAL_BLOCK_CONTENT = String.raw`([\s\S]*?)`;

/**
 * Matches normal field placeholders such as {{Word}}.
 */
const FIELD_PLACEHOLDER_PATTERN = new RegExp(
    `${FIELD_TAG_OPEN}${PLACEHOLDER_FIELD_NAME}${FIELD_TAG_CLOSE}`,
    "g",
);

/**
 * Matches Anki-style conditional blocks such as {{#Word}}...{{/Word}}.
 */
const FIELD_CONDITIONAL_BLOCK_PATTERN = new RegExp(
    [
        FIELD_CONDITION_OPEN,
        CONDITIONAL_FIELD_NAME,
        FIELD_TAG_CLOSE,
        CONDITIONAL_BLOCK_CONTENT,
        FIELD_CONDITION_CLOSE_OPEN,
        SAME_CONDITIONAL_FIELD_NAME,
        FIELD_TAG_CLOSE,
    ].join(""),
    "g",
);

/**
 * Render a complete isolated HTML document for card display.
 */
export function renderCardDocument(input: CardDocRenderInput): string {
    const renderedCard = renderCardTemplate(input.template, input.fields);

    return [
        "<!doctype html>",
        "<html>",
        "<head>",
        "<meta charset=\"utf-8\">",
        "<style>",
        "html, body { margin: 0; min-height: 100%; }",
        "body { box-sizing: border-box; }",
        normalizeTemplateCss(input.css),
        "</style>",
        "</head>",
        "<body class=\"card\">",
        renderedCard,
        "</body>",
        "</html>",
    ].join("");
}

/**
 * Render conditional blocks first, then replace note template placeholders.
 */
function renderCardTemplate(template: string, fields: CardRenderField[]): string {
    const fieldValueMap = createFieldValueMap(fields);
    const tplWithConditionals = renderConditionalBlocks(template, fieldValueMap);
    return tplWithConditionals.replace(FIELD_PLACEHOLDER_PATTERN, (_match, fieldName: string) => {
        const value = fieldValueMap.get(fieldName.trim());
        return value ?? "";
    });
}

/**
 * Render Anki-style field condition blocks: {{#Field}}...{{/Field}}.
 */
function renderConditionalBlocks(template: string, fieldValueMap: Map<string, string>): string {
    return template.replace(
        FIELD_CONDITIONAL_BLOCK_PATTERN,
        (_match, fieldName: string, content: string) => {
            const value = fieldValueMap.get(fieldName.trim())?.trim();
            return value ? content : "";
        },
    );
}

/**
 * Normalize Anki-style CSS snippets before injecting them into a style element.
 */
function normalizeTemplateCss(css: string): string {
    return css
        .replace(/<\/?style[^>]*>/gi, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "");
}

/**
 * Build field value lookup keyed by note template field name.
 */
function createFieldValueMap(fields: CardRenderField[]): Map<string, string> {
    return new Map(fields.map((field) => [field.name, field.value]));
}
