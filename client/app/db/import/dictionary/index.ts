import fs from 'node:fs';
import readline from 'node:readline';
import { getDicDb } from '../../db';
import {
    definitionsTable,
    examplesTable,
    wordPosesTable,
    wordsTable,
} from '../../schema/dictionary';
import { DefinitionInsert, ExampleInsert, WordInsert, WordPosInsert } from '../../schema/dictionary-types';
import { sql } from 'drizzle-orm';
import Database from 'better-sqlite3';
import Logger from 'electron-log/main';
import { convertKeysToCamelCase, hexToBuffer, uuidToBuffer } from '../utils';

export type WordRow = Omit<WordInsert, 'wordId' | 'fingerprint'> & { wordId: string, fingerprint: string };
export type WordPosRow = Omit<WordPosInsert, 'wordId' | 'poseId'> & { wordId: string; poseId: string };
export type DefinitionRow = Omit<DefinitionInsert, 'defId' | 'wordPosId'> & { defId: string; wordPosId: string };
export type ExampleRow = Omit<ExampleInsert, 'expId' | 'defId'> & { expId: string; defId: string };

/**
 * Result of importing a dictionary JSONL file, 
 * including the source file path, 
 * number of processed rows, 
 * and number of skipped rows.
 */
export interface ImportResult {
    source: string;
    processed: number;
    skipped: number;
    failed: number;
}

// Fail early when the local JSONL file does not exist.
function assertFileExists(filePath: string): void {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Input file not found: ${filePath}`);
    }
}

// Create a line-by-line reader for a local JSONL file.
function createLineReader(filePath: string): readline.Interface {
    assertFileExists(filePath);

    return readline.createInterface({
        input: fs.createReadStream(filePath, { encoding: 'utf8' }),
        crlfDelay: Infinity,
    });
}


// Validate a words.jsonl row before writing it to the database.
// Reusable JSONL import pipeline: read, parse, validate, and upsert.
async function importJsonLines<TRow>(
    filePath: string,
    isValidRow: (row: Partial<TRow>) => row is TRow,
    upsertRow: (row: TRow) => Promise<Database.RunResult>,
): Promise<ImportResult> {
    const lineReader = createLineReader(filePath);

    const importResult: ImportResult = {
        source: filePath,
        processed: 0,
        skipped: 0,
        failed: 0,
    };
   
    let total = 0;
    let row: Partial<TRow>;
    for await (const line of lineReader) {
        total += 1;
        const trimmed_str = line.trim();

        if (!trimmed_str) {
            continue;
        }

        try {
            row = convertKeysToCamelCase(JSON.parse(trimmed_str)) as Partial<TRow>;
        } catch (error) {
            if (error instanceof SyntaxError) {
                Logger.error(`Skipping invalid JSON line ${total} in ${filePath}: ${error.message}`);
            } else {
                Logger.error(`Unexpected error processing line ${total} in ${filePath}`);
            }
            importResult.failed += 1;
            continue;
        }

        if (!isValidRow(row)) {
            Logger.warn(`Skipping invalid data row ${total} in ${filePath}: missing required fields`);
            importResult.failed += 1;
            continue;
        }

        let result: Database.RunResult;
        try {
            result = await upsertRow(row);
        } catch (error) {
            Logger.error(`Database error processing line ${total} in ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
            if (error instanceof Database.SqliteError) {
                Logger.error(`SQLite error code: ${error.code}, message: ${error.message}`);
            } else {
                Logger.error(`Unexpected error type: ${error instanceof Error ? error.name : typeof error}`);
            }
            importResult.failed += 1;
            continue;
        }

        importResult.processed += result.changes;
    }

    importResult.skipped = total - (importResult.processed + importResult.failed);
    return importResult;
}

/**
 * Imports word data from a JSONL file into the words table.
 * @param filePath the path to the JSONL file containing word data
 * @returns a promise resolving to the import result
 */
export async function importWords(filePath: string): Promise<ImportResult> {
    const db = getDicDb();
    const isWordImportRow = (row: Partial<WordRow>): row is WordRow =>
        Boolean(row.wordId && row.spelling && row.fingerprint);

    return importJsonLines<WordRow>(filePath, isWordImportRow, async (row) => {
        const insertData: WordInsert = {
            ...row,
            wordId: uuidToBuffer(row.wordId),
            fingerprint: hexToBuffer(row.fingerprint)
        }
        return await db
            .insert(wordsTable)
            .values(insertData)
            .onConflictDoUpdate({
                target: wordsTable.wordId,
                // Only update if the existing record is older than the new data
                setWhere: sql`${wordsTable.updatedAt} < ${insertData.updatedAt}`,
                set: {
                    spelling: insertData.spelling,
                    fingerprint: insertData.fingerprint,
                    phoneticBre: insertData.phoneticBre,
                    phoneticAme: insertData.phoneticAme,
                    updatedAt: insertData.updatedAt,
                },
            });
    });
}

/**
 * Imports word-pos data from a JSONL file into the wordPoses table.
 * @param filePath the path to the JSONL file containing word-pos data
 * @returns a promise resolving to the import result
 */
export async function importWordPoses(filePath: string): Promise<ImportResult> {
    const db = getDicDb();
    const isWordPosImportRow = (row: Partial<WordPosRow>): row is WordPosRow =>
        Boolean(row.poseId && row.wordId);

    return importJsonLines<WordPosRow>(filePath, isWordPosImportRow, async (row) => {
        const insertData: WordPosInsert = {
            ...row,
            poseId: uuidToBuffer(row.poseId),
            wordId: uuidToBuffer(row.wordId)
        };
        return await db
            .insert(wordPosesTable)
            .values(insertData)
            .onConflictDoUpdate({
                target: wordPosesTable.poseId,
                // Only update if the existing record is older than the new data
                setWhere: sql`${wordPosesTable.updatedAt} < ${insertData.updatedAt}`,
                set: {
                    wordId: insertData.wordId,
                    partOfSpeech: insertData.partOfSpeech,
                    updatedAt: insertData.updatedAt,
                }
            });
    });
}

/**
 * Imports definition data from a JSONL file into the definitions table.
 * @param filePath the path to the JSONL file containing definition data
 * @returns a promise resolving to the import result
 */
export async function importDefinitions(filePath: string): Promise<ImportResult> {
    const db = getDicDb();
    const isDefinitionImportRow = (
        row: Partial<DefinitionRow>,
    ): row is DefinitionRow => Boolean(row.defId && row.wordPosId);

    return importJsonLines<DefinitionRow>(filePath, isDefinitionImportRow, async (row) => {
        const insertData: DefinitionInsert = {
            ...row,
            defId: uuidToBuffer(row.defId),
            wordPosId: uuidToBuffer(row.wordPosId)
        };
        return await db
            .insert(definitionsTable)
            .values(insertData)
            .onConflictDoUpdate({
                target: definitionsTable.defId,
                // Only update if the existing record is older than the new data
                setWhere: sql`${definitionsTable.updatedAt} < ${insertData.updatedAt}`,
                set: {
                    wordPosId: insertData.wordPosId,
                    defSrc: insertData.defSrc,
                    defTgt: insertData.defTgt,
                    updatedAt: insertData.updatedAt,
                },
            });
    });
}

/**
 * Imports example data from a JSONL file into the examples table.
 * @param filePath the path to the JSONL file containing example data
 * @returns a promise resolving to the import result
 */
export async function importExamples(filePath: string): Promise<ImportResult> {
    const db = getDicDb();
    const isExampleImportRow = (row: Partial<ExampleRow>): row is ExampleRow =>
        Boolean(row.expId && row.defId && row.exSrc);

    return importJsonLines<ExampleRow>(filePath, isExampleImportRow, async (row) => {
        const insertData: ExampleInsert = {
            ...row,
            expId: uuidToBuffer(row.expId),
            defId: uuidToBuffer(row.defId)
        };
        return await db
            .insert(examplesTable)
            .values(insertData)
            .onConflictDoUpdate({
                target: examplesTable.expId,
                // Only update if the existing record is older than the new data
                setWhere: sql`${examplesTable.updatedAt} < ${insertData.updatedAt}`,
                set: {
                    defId: insertData.defId,
                    exSrc: insertData.exSrc,
                    exTgt: insertData.exTgt,
                    updatedAt: insertData.updatedAt,
                }
            });
    });
}
