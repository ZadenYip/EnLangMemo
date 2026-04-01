import { getDicDb } from "../db";
import { IDatabaseService as IDictionaryService } from "./dic-service-interface";
import type { Definition, DictionaryEntry, Sense } from "./dic-service-types";
import { wordsTable } from "../schema/dictionary";
import { eq } from "drizzle-orm";
import { lemmatize } from "@main/lemmatization";
import { importWords } from "../import/dictionary";
import { ImportResult } from "../import/dictionary/dic-import-type";

export class DictionaryService implements IDictionaryService {
    /**
     * without lemmatization, 
     * e.g. "running" would not be found if only "run" is in the dictionary; 
     * with lemmatization, it would try to find "run" if "running" is not found.
     * @param spelling the word spelling to query, e.g. "running"
     */
    private async getEntry(spelling: string) {
        if (!spelling) {
            return null;
        }
        
        const row = await getDicDb().query.wordsTable.findFirst({
            where: eq(wordsTable.spelling, spelling),
            columns: {
                wordId: false,
                fingerprint: false,
                createdAt: false,
                updatedAt: false,
            },
            with: {
                poses: {
                    columns: {
                        poseId: false,
                        wordId: false,
                        createdAt: false,
                        updatedAt: false,
                    },
                    with: {
                        definitions: {
                            columns: {
                                defId: false,
                                wordPosId: false,
                                createdAt: false,
                                updatedAt: false,
                            },
                            with: {
                                examples: {
                                    columns: {
                                        expId: false,
                                        defId: false,
                                        createdAt: false,
                                        updatedAt: false,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        return row;
    }

    /**
     * if the exact spelling is not found, would try the lemmatized form, e.g. "running" -> "run"
     * @param spelling the word spelling to query, e.g. "running"
     * @returns the dictionary entry if found, otherwise null
     */
    public async queryWord(spelling: string): Promise<DictionaryEntry | null> {
        let row = await this.getEntry(spelling);

        if (!row) {
            // Try lemmatized form if the original spelling is not found.
            row = await this.getEntry(lemmatize(spelling));
            if (!row) {
                return null;
            }
        }

        const result: DictionaryEntry = {
            word: row.spelling,
            phoneticSymbol: {
                bre: row.phoneticAme ?? "",
                ame: row.phoneticBre ?? "",
            },
            senses: row.poses.map<Sense>((pose) => ({
                partOfSpeech: pose.partOfSpeech ?? "",
                definitions: pose.definitions.map<Definition>((def) => ({
                    definition: {
                        src: def.defSrc ?? "",
                        target: def.defTgt ?? "",
                    },
                    examples: def.examples.map((exp) => ({
                        src: exp.exSrc ?? "",
                        target: exp.exTgt ?? "",
                    })),
                })),
            })),
        };

        return result;
    }

    public async importWords(path: string): Promise<ImportResult> {
        return await importWords(path);
    }

    public async importWordPoses(path: string): Promise<ImportResult> {
        return await importWords(path);
    }

    public async importDefinitions(path: string): Promise<ImportResult> {
        return await importWords(path);
    }

    public async importExamples(path: string): Promise<ImportResult> {
        return await importWords(path);
    }

}
