import { getDicDb } from "../../db.js";
import { IDatabaseService as IDictionaryService } from "./dic-service-interface.js";
import type { Definition, DictionaryEntry, Sense } from "./dic-service-types.js";
import { definitionsTable, examplesTable, wordPosesTable, wordsTable } from "../../schema/dictionary/dic.js";
import { eq } from "drizzle-orm";
import { lemmatize } from "@main/lemmatization/index.js";
import { impDictionaryDetailed } from "../../import/dictionary/index.js";
import { DicImpProgress } from "../../import/dictionary/dic-import-types.js";
import { Observable } from "rxjs";

export class DictionaryService implements IDictionaryService {
    /**
     * Query a complete dictionary entry by word spelling using cascading relations
     * Execution flow: words -> word_poses -> definitions -> examples
     * 
     * without lemmatization, e.g. "running" would not be found if only "run" is in the dictionary;
     * with lemmatization, it would try to find "run" if "running" is not found.
     * 
     * @param spelling the word spelling to query, e.g. "running"
     * @returns complete word data structure (with pos, definitions, examples), null if not found
     */
    private async getEntry(spelling: string): Promise<DictionaryEntry | null> {
        if (!spelling) {
            return null;
        }

        const rows = await getDicDb()
            .select({
                spelling: wordsTable.spelling,
                phoneticBre: wordsTable.phoneticBre,
                phoneticAme: wordsTable.phoneticAme,
                poseId: wordPosesTable.poseId,
                partOfSpeech: wordPosesTable.partOfSpeech,
                defId: definitionsTable.defId,
                defSrc: definitionsTable.defSrc,
                defTgt: definitionsTable.defTgt,
                exSrc: examplesTable.exSrc,
                exTgt: examplesTable.exTgt,
            })
            .from(wordsTable)
            .leftJoin(wordPosesTable, eq(wordPosesTable.wordId, wordsTable.wordId))
            .leftJoin(definitionsTable, eq(definitionsTable.wordPosId, wordPosesTable.poseId))
            .leftJoin(examplesTable, eq(examplesTable.defId, definitionsTable.defId))
            .where(eq(wordsTable.spelling, spelling));

        if (rows.length === 0) {
            return null;
        }

        const sensesByPoseId = new Map<number, Sense>();
        const definitionsByDefId = new Map<number, Definition>();

        for (const row of rows) {
            if (!row.poseId) {
                continue;
            }

            const poseId = row.poseId;
            let sense = sensesByPoseId.get(poseId);
            if (!sense) {
                sense = {
                    partOfSpeech: row.partOfSpeech ?? "",
                    definitions: [],
                };
                sensesByPoseId.set(poseId, sense);
            }

            if (!row.defId) {
                continue;
            }

            const defId = row.defId;
            let definition = definitionsByDefId.get(defId);
            if (!definition) {
                definition = {
                    defId,
                    definition: {
                        src: row.defSrc ?? "",
                        target: row.defTgt ?? "",
                    },
                    examples: [],
                };
                definitionsByDefId.set(defId, definition);
                sense.definitions.push(definition);
            }

            if (row.exSrc) {
                definition.examples?.push({
                    src: row.exSrc,
                    target: row.exTgt ?? "",
                });
            }
        }

        return {
            word: rows[0].spelling,
            phoneticSymbol: {
                bre: rows[0].phoneticAme ?? "",
                ame: rows[0].phoneticBre ?? "",
            },
            senses: Array.from(sensesByPoseId.values()),
        };
    }

    /**
     * if the exact spelling is not found, would try the lemmatized form, e.g. "running" -> "run"
     * @param spelling the word spelling to query, e.g. "running"
     * @returns the dictionary entry if found, otherwise null
     */
    public async queryWord(spelling: string): Promise<DictionaryEntry | null> {
        let entry = await this.getEntry(spelling);

        if (!entry) {
            // Try lemmatized form if the original spelling is not found.
            entry = await this.getEntry(lemmatize(spelling));
            if (!entry) {
                return null;
            }
        }

        return entry;
    }

    public importDictionary$(path: string): Observable<DicImpProgress> {
        return new Observable<DicImpProgress>((subscriber) => {
            const runImport = async () => {
                try {
                    subscriber.next({ progress: 0, stage: "words" });
                    const result = await impDictionaryDetailed(path, (progress) => subscriber.next(progress));
                    subscriber.next({ progress: 100, stage: "completed", result });
                    subscriber.complete();
                } catch (error) {
                    subscriber.error(error);
                }
            };

            runImport();
        });
    }

}
