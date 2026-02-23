

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
    cefr: string;
    definition: {
        source: string;
        target: string;
    };
    examples: Example[];
}

export interface Example {
    source: string;
    target: string;
}