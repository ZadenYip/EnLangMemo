import fs from "node:fs";
import readline from "node:readline";
import { getDicDb } from "../../db";
import {
    definitionsTable,
    examplesTable,
    wordPosesTable,
    wordsTable,
} from "../../schema/dictionary/dic";
import { DefinitionInsert, ExampleInsert, WordInsert, WordPosInsert } from "../../schema/dictionary/dic-schema-infers";
import { sql } from "drizzle-orm";
import Database from "better-sqlite3";
import Logger from "electron-log/main";
import { convertKeysToCamelCase } from "../utils";
import { ImportResult } from "./dic-import-types";

export type WordRow = WordInsert;
export type WordPosRow = WordPosInsert;
export type DefinitionRow = DefinitionInsert;
export type ExampleRow = ExampleInsert;

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
        input: fs.createReadStream(filePath, { encoding: "utf8" }),
        crlfDelay: Infinity,
    });
}


// Validate a words.jsonl row before writing it to the database.
// Reusable JSONL import pipeline: read, parse, validate, and upsert.
async function importJsonLines<TRow>(
    filePath: string,
    isValidRowFn: (row: Partial<TRow>) => row is TRow,
    upsertRowsFn: (rows: TRow[]) => Promise<Database.RunResult>,
): Promise<ImportResult> {
    const importResult: ImportResult = {
        total: 0,
        processed: 0,
        skipped: 0,
        failed: 0,
    };
    let lineReader;
    try {
        lineReader = createLineReader(filePath);
    } catch (error) {
        Logger.error(
            `Failed to create line reader for file ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
        );

        // indicate file read error with total = -1
        importResult.total = -1;
        return importResult;
    }


    let row: Partial<TRow>;
    let batch: TRow[] = [];
    for await (const line of lineReader) {
        importResult.total += 1;
        const trimmed_str = line.trim();

        if (!trimmed_str) {
            continue;
        }

        try {
            row = convertKeysToCamelCase(JSON.parse(trimmed_str)) as Partial<TRow>;
        } catch (error) {
            if (error instanceof SyntaxError) {
                Logger.error(`Skipping invalid JSON line ${importResult.total} in ${filePath}: ${error.message}`);
            } else {
                Logger.error(`Unexpected error processing line ${importResult.total} in ${filePath}`);
            }
            importResult.failed += 1;
            continue;
        }

        if (!isValidRowFn(row)) {
            Logger.warn(`Skipping invalid data row ${importResult.total} in ${filePath}: missing required fields`);
            importResult.failed += 1;
            continue;
        }

        batch.push(row);
        if (batch.length >= 1000) {
            await upsertBatch(batch, upsertRowsFn, importResult, filePath);
            batch = [];
        }
    }

    // Process any remaining rows in the batch after reading all lines
    if (batch.length > 0) {
        await upsertBatch(batch, upsertRowsFn, importResult, filePath);
    }

    importResult.skipped = importResult.total - (importResult.processed + importResult.failed);
    return importResult;
}

async function upsertBatch<TRow>(
    batch: TRow[],
    upsertRowsFn: (rows: TRow[]) => Promise<Database.RunResult>,
    pointerImportResult: ImportResult,
    filePath: string,
) {
    let result: Database.RunResult;
    try {
        result = await upsertRowsFn(batch);
        pointerImportResult.processed += result.changes;
    } catch (error) {
        Logger.error(
            `Database error processing line ${pointerImportResult.total} in ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
        );
        if (error instanceof Database.SqliteError) {
            Logger.error(
                `SQLite error code: ${error.code}, message: ${error.message}`,
            );
        } else {
            Logger.error(
                `Unexpected error type: ${error instanceof Error ? error.name : typeof error}`,
            );
        }
        pointerImportResult.failed += 1;
    }
}

/**
 * Imports word data from a JSONL file into the words table.
 * @param filePath the path to the JSONL file containing word data
 * @returns a promise resolving to the import result
 */
export async function impWords(filePath: string): Promise<ImportResult> {

    const isWordImportRow = (row: Partial<WordRow>): row is WordRow =>
        Boolean(
            Number.isInteger(row.wordId)
            && row.spelling
            && Number.isInteger(row.entryVersion)
            && row.entryVersion! > 0,
        );

    const impResult = importJsonLines<WordRow>(filePath, isWordImportRow, async (rows) => {
        const insertDatas = rows;

        // TODO DrizzleORM does not support async in transaction for better-sqlite3
        // see：https://github.com/drizzle-team/drizzle-orm/issues/2275

        const transfactionResult = getDicDb().transaction((tx) => {
            const dbResult = tx
            .insert(wordsTable)
            .values(insertDatas)
            .onConflictDoUpdate({
                target: wordsTable.wordId,
                // Only update if the existing record is older than the new data
                setWhere: sql.raw(`${wordsTable.updatedAt.name} < excluded.${wordsTable.updatedAt.name}`),
                set: {
                    spelling: sql.raw(`excluded.${wordsTable.spelling.name}`),
                    entryVersion: sql.raw(`excluded.${wordsTable.entryVersion.name}`),
                    phoneticBre: sql.raw(`excluded.${wordsTable.phoneticBre.name}`),
                    phoneticAme: sql.raw(`excluded.${wordsTable.phoneticAme.name}`),
                    updatedAt: sql.raw(`excluded.${wordsTable.updatedAt.name}`),
                },
            }).run();
            return dbResult;
        });
        return transfactionResult;
    });
    return impResult; 
}

/**
 * Imports word-pos data from a JSONL file into the wordPoses table.
 * @param filePath the path to the JSONL file containing word-pos data
 * @returns a promise resolving to the import result
 */
export async function impWordPoses(filePath: string): Promise<ImportResult> {
    const isWordPosImportRow = (row: Partial<WordPosRow>): row is WordPosRow =>
        Boolean(Number.isInteger(row.poseId) && Number.isInteger(row.wordId));

    const impResult = importJsonLines<WordPosRow>(filePath, isWordPosImportRow, async (rows) => {
        const insertDatas: WordPosInsert[] = rows;
        
        // TODO DrizzleORM does not support async in transaction for better-sqlite3
        // see：https://github.com/drizzle-team/drizzle-orm/issues/2275
        const transfactionResult = getDicDb().transaction((tx) => {
            const dbResult = tx
            .insert(wordPosesTable)
            .values(insertDatas)
            .onConflictDoUpdate({
                target: wordPosesTable.poseId,
                // Only update if the existing record is older than the new data
                setWhere: sql.raw(`${wordPosesTable.updatedAt.name} < excluded.${wordPosesTable.updatedAt.name}`),
                set: {
                    wordId: sql.raw(`excluded.${wordPosesTable.wordId.name}`),
                    partOfSpeech: sql.raw(`excluded.${wordPosesTable.partOfSpeech.name}`),
                    updatedAt: sql.raw(`excluded.${wordPosesTable.updatedAt.name}`),
                }
            }).run();
            
            return dbResult;
        });

        return transfactionResult;
    });
    return impResult;
}

/**
 * Imports definition data from a JSONL file into the definitions table.
 * @param filePath the path to the JSONL file containing definition data
 * @returns a promise resolving to the import result
 */
export async function impDefinitions(filePath: string): Promise<ImportResult> {
    const isDefinitionImportRow = (
        row: Partial<DefinitionRow>,
    ): row is DefinitionRow => Boolean(Number.isInteger(row.defId) && Number.isInteger(row.wordPosId));

    const impResult = importJsonLines<DefinitionRow>(filePath, isDefinitionImportRow, async (rows) => {
        const insertDatas: DefinitionInsert[] = rows;

        // TODO DrizzleORM does not support async in transaction for better-sqlite3
        // see：https://github.com/drizzle-team/drizzle-orm/issues/2275
        const transfactionResult = getDicDb().transaction((tx) => {
            const dbResult = tx
                .insert(definitionsTable)
                .values(insertDatas)
                .onConflictDoUpdate({
                    target: definitionsTable.defId,
                    // Only update if the existing record is older than the new data
                    setWhere: sql.raw(`${definitionsTable.updatedAt.name} < excluded.${definitionsTable.updatedAt.name}`),
                    set: {
                        wordPosId: sql.raw(`excluded.${definitionsTable.wordPosId.name}`),
                        defSrc: sql.raw(`excluded.${definitionsTable.defSrc.name}`),
                        defTgt: sql.raw(`excluded.${definitionsTable.defTgt.name}`),
                        updatedAt: sql.raw(`excluded.${definitionsTable.updatedAt.name}`),
                    },
                }).run();
            return dbResult;
        });

        return transfactionResult;
    });
    return impResult;
}

/**
 * Imports example data from a JSONL file into the examples table.
 * @param filePath the path to the JSONL file containing example data
 * @returns a promise resolving to the import result
 */
export async function impExamples(filePath: string): Promise<ImportResult> {
    const db = getDicDb();
    const isExampleImportRow = (row: Partial<ExampleRow>): row is ExampleRow =>
        Boolean(Number.isInteger(row.expId) && Number.isInteger(row.defId) && row.exSrc);

    const impResult = importJsonLines<ExampleRow>(filePath, isExampleImportRow, async (rows) => {
        const insertDatas: ExampleInsert[] = rows;

        // TODO DrizzleORM does not support async in transaction for better-sqlite3
        // see：https://github.com/drizzle-team/drizzle-orm/issues/2275
        const transfactionResult = db.transaction((tx) => {
            const dbResult = tx
                .insert(examplesTable)
                .values(insertDatas)
                .onConflictDoUpdate({
                    target: examplesTable.expId,
                    // Only update if the existing record is older than the new data
                    setWhere: sql.raw(`${examplesTable.updatedAt.name} < excluded.${examplesTable.updatedAt.name}`),
                    set: {
                        defId: sql.raw(`excluded.${examplesTable.defId.name}`),
                        exSrc: sql.raw(`excluded.${examplesTable.exSrc.name}`),
                        exTgt: sql.raw(`excluded.${examplesTable.exTgt.name}`),
                        updatedAt: sql.raw(`excluded.${examplesTable.updatedAt.name}`),
                    }
                }).run();
            return dbResult;
        });

        return transfactionResult;
    });
    return impResult;
}
