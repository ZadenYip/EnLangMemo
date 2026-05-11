import { CardTemplate, NoteTemplate, TemplateField } from "./nt-service.types";


export function genNoteTpl(): NoteTemplate {
    const dateTime = Date.now();
    const questionField = createField(dateTime, "Question Field");
    const answerField = createField(dateTime + 1, "Answer");
    return {
        css: "",
        sortField: questionField.id,
        fields: [questionField, answerField],
        cardtpls: [genCardTpl()],
    };
}

export function genCardTpl(name = "Default Card Template"): CardTemplate {
    const idTime = Date.now();
    return {
        name,
        id: idTime,
        front: "Question: {{Question Field}}",
        back: "Answer: {{Answer}}",
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
