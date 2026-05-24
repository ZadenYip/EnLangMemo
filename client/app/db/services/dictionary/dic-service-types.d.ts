export interface DictionaryEntry {
    word: string;
    phoneticSymbol: {
        // british and american phonetic symbols
        bre: string;
        ame: string;
    }
    senses: Sense[];
}

export interface Sense {
    partOfSpeech: string;
    definitions: Definition[];
}

export interface Definition {
    /**
     * Definition business id stored as hex string.
     */
    defId: string;
    definition: BilingualText;
    examples?: BilingualText[];
}

export interface BilingualText {
    src: string;
    target: string;
}
