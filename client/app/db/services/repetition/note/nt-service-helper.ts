import { CardTemplate, NoteTemplate, TemplateField } from "./nt-service.types";


export function genNoteTpl(): NoteTemplate {
    const defaultField = genDefaultField();
    return {
        css: "",
        sortField: defaultField.id,
        fields: [defaultField],
        cardtpls: [genCardTpl()],
    };
}

export function createCardTpl(idTime: number, front: string, back: string): CardTemplate {
    return {
        id: idTime,
        front,
        back,
    };
}

export function genCardTpl(): CardTemplate {
    return createCardTpl(Date.now(), "", "");
}

export function createField(idTime: number, name: string): TemplateField {
    return {
        id: idTime,
        name,
    };
}

export function genDefaultField(): TemplateField {
    return createField(Date.now(), "Default Field");
}