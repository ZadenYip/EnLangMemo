import { CardTemplate, NoteTemplate, TemplateField } from "./nt-service.types";


export function genNoteTpl(): NoteTemplate {
    const dateTime = Date.now();
    const ctxField = createField(dateTime, "Context");
    const phonetic = createField(dateTime + 1, "Phonetic");
    const srcDefinition = createField(dateTime + 2, "Source Definition");
    const tgtDefinition = createField(dateTime + 3, "Target Definition");
    const audio = createField(dateTime + 4, "Audio");
    return {
        css: "",
        sortField: ctxField.id,
        fields: [ctxField, phonetic, srcDefinition, tgtDefinition, audio],
        cardtpls: [genCardTpl()],
    };
}

export function genCardTpl(name = "Default Card Template"): CardTemplate {
    const idTime = Date.now();
    return {
        name,
        id: idTime,
        front: "Question: {{Context}}",
        back: "Answer: {{Phonetic}}",
    };
}

export function createCardTpl(idTime: number, name: string, front: string, back: string): CardTemplate {
    return {
        id: idTime,
        name,
        front,
        back,
    };
}

export function createField(idTime: number, name: string): TemplateField {
    return {
        id: idTime,
        name,
    };
}
