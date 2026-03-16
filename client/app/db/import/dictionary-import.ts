import fs from 'node:fs';
import readline from 'node:readline';
import { getDicDb } from '../db';
import {
    definitionsTable,
    examplesTable,
    wordPosesTable,
    wordsTable,
} from '../schema/dictionary';

// Shared timestamp columns used by all table-level JSONL rows.
interface TimeCols {
    created_at: number;
    updated_at: number;
}

// One line from words.jsonl.
export interface WordImportRow extends TimeCols {
    word_id: string;
    spelling: string;
    fingerprint: string;
    phonetic_bre?: string | null;
    phonetic_ame?: string | null;
}

// One line from word_poses.jsonl.
export interface WordPosImportRow extends TimeCols {
    pose_id: string;
    word_id: string;
    part_of_speech?: string | null;
}

// One line from definitions.jsonl.
export interface DefinitionImportRow extends TimeCols {
    def_id: string;
    word_pos_id: string;
    def_src?: string | null;
    def_tgt?: string | null;
}

// One line from examples.jsonl.
export interface ExampleImportRow extends TimeCols {
    exp_id: string;
    def_id: string;
    ex_src: string;
    ex_tgt?: string | null;
}

// Common import summary returned by all import functions.
export interface DictionaryImportResult {
    source: string;
    processed: number;
    skipped: number;
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

// Convert a UUID string into the SQLite blob format used by the schema.
function uuidToBuffer(uuid: string): Buffer {
    return Buffer.from(uuid.replaceAll('-', ''), 'hex');
}

// Convert a hex string fingerprint into a SQLite blob.
function hexToBuffer(value: string): Buffer {
    return Buffer.from(value, 'hex');
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

        const row = JSON.parse(trimmed_str) as Partial<TRow>;

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
        Boolean(row.word_id && row.spelling && row.fingerprint);

    return importJsonLines<WordImportRow>(filePath, isWordImportRow, async (row) => {
        await db
            .insert(wordsTable)
            .values({
                wordId: uuidToBuffer(row.word_id),
                spelling: row.spelling,
                fingerprint: hexToBuffer(row.fingerprint),
                phoneticBre: row.phonetic_bre ?? null,
                phoneticAme: row.phonetic_ame ?? null,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            })
            .onConflictDoUpdate({
                target: wordsTable.spelling,
                set: {
                    wordId: uuidToBuffer(row.word_id),
                    fingerprint: hexToBuffer(row.fingerprint),
                    phoneticBre: row.phonetic_bre ?? null,
                    phoneticAme: row.phonetic_ame ?? null,
                    updatedAt: row.updated_at,
                },
            });
    });
}

// Import rows from word_poses.jsonl into the word_poses table.
export async function importWordPoses(filePath: string): Promise<DictionaryImportResult> {
    const db = getDicDb();
    const isWordPosImportRow = (row: Partial<WordPosImportRow>): row is WordPosImportRow =>
        Boolean(row.pose_id && row.word_id);

    return importJsonLines<WordPosImportRow>(filePath, isWordPosImportRow, async (row) => {
        await db
            .insert(wordPosesTable)
            .values({
                poseId: uuidToBuffer(row.pose_id),
                wordId: uuidToBuffer(row.word_id),
                partOfSpeech: row.part_of_speech ?? null,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            })
            .onConflictDoUpdate({
                target: wordPosesTable.poseId,
                set: {
                    wordId: uuidToBuffer(row.word_id),
                    partOfSpeech: row.part_of_speech ?? null,
                    updatedAt: row.updated_at,
                },
            });
    });
}

// Import rows from definitions.jsonl into the definitions table.
export async function importDefinitions(filePath: string): Promise<DictionaryImportResult> {
    const db = getDicDb();
    const isDefinitionImportRow = (
        row: Partial<DefinitionImportRow>,
    ): row is DefinitionImportRow => Boolean(row.def_id && row.word_pos_id);

    return importJsonLines<DefinitionImportRow>(filePath, isDefinitionImportRow, async (row) => {
        await db
            .insert(definitionsTable)
            .values({
                defId: uuidToBuffer(row.def_id),
                wordPosId: uuidToBuffer(row.word_pos_id),
                defSrc: row.def_src ?? null,
                defTgt: row.def_tgt ?? null,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            })
            .onConflictDoUpdate({
                target: definitionsTable.defId,
                set: {
                    wordPosId: uuidToBuffer(row.word_pos_id),
                    defSrc: row.def_src ?? null,
                    defTgt: row.def_tgt ?? null,
                    updatedAt: row.updated_at,
                },
            });
    });
}

// Import rows from examples.jsonl into the examples table.
export async function importExamples(filePath: string): Promise<DictionaryImportResult> {
    const db = getDicDb();
    const isExampleImportRow = (row: Partial<ExampleImportRow>): row is ExampleImportRow =>
        Boolean(row.exp_id && row.def_id && row.ex_src);

    return importJsonLines<ExampleImportRow>(filePath, isExampleImportRow, async (row) => {
        await db
            .insert(examplesTable)
            .values({
                expId: uuidToBuffer(row.exp_id),
                defId: uuidToBuffer(row.def_id),
                exSrc: row.ex_src,
                exTgt: row.ex_tgt ?? null,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            })
            .onConflictDoUpdate({
                target: examplesTable.expId,
                set: {
                    defId: uuidToBuffer(row.def_id),
                    exSrc: row.ex_src,
                    exTgt: row.ex_tgt ?? null,
                    updatedAt: row.updated_at,
                },
            });
    });
}
