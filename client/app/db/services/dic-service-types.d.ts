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
    definition: BilingualText;
    examples?: BilingualText[];
}

export interface BilingualText {
    src: string;
    target: string;
}
