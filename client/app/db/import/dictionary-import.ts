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

type WordImportRow = Omit<WordInsert, 'wordId' | 'fingerprint'> & { wordId: string, fingerprint: string };
type WordPosImportRow = Omit<WordPosInsert, 'wordId' | 'poseId'> & { wordId: string; poseId: string };
type DefinitionImportRow = Omit<DefinitionInsert, 'defId' | 'wordPosId'> & { defId: string; wordPosId: string };
type ExampleImportRow = Omit<ExampleInsert, 'expId' | 'defId'> & { expId: string; defId: string };

// Common import summary returned by all import functions.
export interface DictionaryImportResult {
    source: string;
    processed: number;
    skipped: number;
}

function withoutCreatedAt<T extends { createdAt: unknown }>(data: T): Omit<T, 'createdAt'> {
    const { createdAt: _createdAt, ...rest } = data;
    return rest;
}

/**
 * Converts a snake_case string to camelCase.
 * @param str - a snake_case string
 * @returns - a camelCase string
 */
function toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function convertKeysToCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(convertKeysToCamelCase);
    } else if (obj !== null && typeof obj === 'object') {
        return Object.entries(obj).reduce((acc, [key, value]) => {
            const camelKey = toCamelCase(key);
            acc[camelKey] = convertKeysToCamelCase(value); // 递归处理子对象
            return acc;
        }, {} as Record<string, any>);
    }
    return obj; // 如果是基本类型，直接返回
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
    upsertRow: (row: TRow) => Promise<void>,
): Promise<DictionaryImportResult> {
    const lineReader = createLineReader(filePath);

    let processed = 0;
    let skipped = 0;

    for await (const line of lineReader) {
        const trimmed_str = line.trim();

        if (!trimmed_str) {
            continue;
        }

        const row = convertKeysToCamelCase(JSON.parse(trimmed_str)) as Partial<TRow>;

        if (!isValidRow(row)) {
            skipped += 1;
            continue;
        }

        await upsertRow(row);
        processed += 1;
    }

    return {
        source: filePath,
        processed,
        skipped,
    };
}

// Import rows from words.jsonl into the words table.
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
        await db
            .insert(wordsTable)
            .values(insertData)
            .onConflictDoUpdate({
                target: wordsTable.spelling,
                set: withoutCreatedAt(insertData),
            });
    });
}

// Import rows from word_poses.jsonl into the word_poses table.
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
        await db
            .insert(wordPosesTable)
            .values(insertData)
            .onConflictDoUpdate({
                target: wordPosesTable.poseId,
                set: withoutCreatedAt(insertData),
            });
    });
}

// Import rows from definitions.jsonl into the definitions table.
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
        await db
            .insert(definitionsTable)
            .values(insertData)
            .onConflictDoUpdate({
                target: definitionsTable.defId,
                set: withoutCreatedAt(insertData),
            });
    });
}

// Import rows from examples.jsonl into the examples table.
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
        await db
            .insert(examplesTable)
            .values(insertData)
            .onConflictDoUpdate({
                target: examplesTable.expId,
                set: withoutCreatedAt(insertData),
            });
    });
}
