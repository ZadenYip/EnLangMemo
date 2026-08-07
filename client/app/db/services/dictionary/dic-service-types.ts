export interface DictionaryEntry {
    word: string;
    phoneticSymbol: {
        // british and american phonetic symbols
        bre: string;
        ame: string;
    };
    senses: Sense[];
}

export interface Sense {
    partOfSpeech: string;
    definitions: Definition[];
}

export interface Definition {
    /**
     * Official dictionary definition id.
     */
    defId: number;
    definition: BilingualText;
    examples?: BilingualText[];
}

export interface BilingualText {
    src: string;
    target: string;
}
