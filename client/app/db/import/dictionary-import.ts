import fs from 'node:fs';
import readline from 'node:readline';
import { getDicDb } from '../db';
import {
    definitionsTable,
    examplesTable,
    wordPosesTable,
    wordsTable,
} from '../schema/dictionary';
import { DefinitionInsert, ExampleInsert, WordInsert, WordPosInsert } from '../schema/dictionary-types';
import { sql } from 'drizzle-orm';
import Database from 'better-sqlite3';
import Logger from 'electron-log/main';

export type WordImportRow = Omit<WordInsert, 'wordId' | 'fingerprint'> & { wordId: string, fingerprint: string };
export type WordPosImportRow = Omit<WordPosInsert, 'wordId' | 'poseId'> & { wordId: string; poseId: string };
export type DefinitionImportRow = Omit<DefinitionInsert, 'defId' | 'wordPosId'> & { defId: string; wordPosId: string };
export type ExampleImportRow = Omit<ExampleInsert, 'expId' | 'defId'> & { expId: string; defId: string };

/**
 * Result of importing a dictionary JSONL file, 
 * including the source file path, 
 * number of processed rows, 
 * and number of skipped rows.
 */
export interface DictionaryImportResult {
    source: string;
    processed: number;
    skipped: number;
    invalidRow: number;
}

/**
 * Converts a snake_case string to camelCase.
 * @param str a snake_case string
 * @returns a camelCase string
 */
function toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Converts keys from snake_case to camelCase recursively.
 * @param obj an object or array to recursively convert keys from snake_case to camelCase
 * @returns the object or array with camelCase keys
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertKeysToCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(convertKeysToCamelCase);
    } else if (obj !== null && typeof obj === 'object') {
        return Object.entries(obj).reduce((acc, [key, value]) => {
            const camelKey = toCamelCase(key);
            acc[camelKey] = convertKeysToCamelCase(value); // 递归处理子对象
            return acc;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }, {} as Record<string, any>);
    }
    // if it's a basic type (string, number, boolean, null, undefined), return as is
    return obj;
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

/**
 * Converts a standard UUID string to a 16-byte buffer.
 * @param uuid - a standard UUID string (e.g., '123e4567-e89b-12d3-a456-426614174000')
 * @returns - a 16-byte buffer representing the UUID
 */
export function uuidToBuffer(uuid: string): Buffer {
    return Buffer.from(uuid.replaceAll('-', ''), 'hex');
}

/**
 * Converts a hexadecimal string to a bytes buffer.
 * @param value - sha256 fingerprint
 * @returns bytes buffer
 */
export function hexToBuffer(value: string): Buffer {
    return Buffer.from(value, 'hex');
}

/**
 * Converts a bytes buffer to a hexadecimal string.
 * @param value - sha256 fingerprint buffer
 * @returns hexadecimal string
 */
export function bufferToHex(value: Buffer): string {
    return value.toString('hex');
}

// Validate a words.jsonl row before writing it to the database.
// Reusable JSONL import pipeline: read, parse, validate, and upsert.
async function importJsonLines<TRow>(
    filePath: string,
    isValidRow: (row: Partial<TRow>) => row is TRow,
    upsertRow: (row: TRow) => Promise<Database.RunResult>,
): Promise<DictionaryImportResult> {
    const lineReader = createLineReader(filePath);

    let total = 0;
    let processed = 0;
    let invalidRow = 0;
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
            invalidRow += 1;
            continue;
        }

        if (!isValidRow(row)) {
            invalidRow += 1;
            continue;
        }

        const result = await upsertRow(row);
        processed += result.changes;
    }

    return {
        source: filePath,
        skipped: total - (processed + invalidRow),
        invalidRow: invalidRow,
        processed: processed,
    };
}

/**
 * Imports word data from a JSONL file into the words table.
 * @param filePath the path to the JSONL file containing word data
 * @returns a promise resolving to the import result
 */
export async function importWords(filePath: string): Promise<DictionaryImportResult> {
    const db = getDicDb();
    const isWordImportRow = (row: Partial<WordImportRow>): row is WordImportRow =>
        Boolean(row.wordId && row.spelling && row.fingerprint);

    return importJsonLines<WordImportRow>(filePath, isWordImportRow, async (row) => {
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
export async function importWordPoses(filePath: string): Promise<DictionaryImportResult> {
    const db = getDicDb();
    const isWordPosImportRow = (row: Partial<WordPosImportRow>): row is WordPosImportRow =>
        Boolean(row.poseId && row.wordId);

    return importJsonLines<WordPosImportRow>(filePath, isWordPosImportRow, async (row) => {
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
export async function importDefinitions(filePath: string): Promise<DictionaryImportResult> {
    const db = getDicDb();
    const isDefinitionImportRow = (
        row: Partial<DefinitionImportRow>,
    ): row is DefinitionImportRow => Boolean(row.defId && row.wordPosId);

    return importJsonLines<DefinitionImportRow>(filePath, isDefinitionImportRow, async (row) => {
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
export async function importExamples(filePath: string): Promise<DictionaryImportResult> {
    const db = getDicDb();
    const isExampleImportRow = (row: Partial<ExampleImportRow>): row is ExampleImportRow =>
        Boolean(row.expId && row.defId && row.exSrc);

    return importJsonLines<ExampleImportRow>(filePath, isExampleImportRow, async (row) => {
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
