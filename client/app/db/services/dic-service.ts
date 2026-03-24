import Database from 'better-sqlite3';
import { getDicDb, runSQL } from '../db';
import { IDatabaseService } from '../service-interface';
import type { Definition, DictionaryEntry, Sense } from './dic-service-types';
import { wordsTable } from '../schema/dictionary';
import { eq } from 'drizzle-orm';

export class DatabaseService implements IDatabaseService {
    public async runSQL(
        sql: string,
        params: any[] = [],
    ): Promise<any[] | Database.RunResult> {
        return runSQL(sql, params);
    }

    public async queryWord(spelling: string): Promise<DictionaryEntry | null> {
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

        if (!row) {
            return null;
        }

        const result: DictionaryEntry = {
            word: row.spelling,
            phoneticSymbol: {
                bre: row.phoneticAme ?? "",
                ame: row.phoneticBre ?? "",
            },
            senses: row.poses.map<Sense>(pose => ({
                partOfSpeech: pose.partOfSpeech ?? "",
                definitions: pose.definitions.map<Definition>(def => ({
                    definition: {
                        src: def.defSrc ?? "",
                        target: def.defTgt ?? "",
                    },
                    examples: def.examples.map(exp => ({
                        src: exp.exSrc ?? "",
                        target: exp.exTgt ?? "",
                    })),
                })),
            }))
        }

        return result;
    }
}
