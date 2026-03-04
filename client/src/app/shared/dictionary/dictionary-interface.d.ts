

export interface DictionaryEntry {
    word: string;
    phoneticSymbol: string[];
    senses: Sense[];
}

export interface Sense {
    partOfSpeech: string;
    definitions: Definition[];
}

export interface Definition {
    cefr?: string;
    definition: BilingualText;
    examples?: BilingualText[];
}

export interface BilingualText {
    source: string;
    target: string;
}
