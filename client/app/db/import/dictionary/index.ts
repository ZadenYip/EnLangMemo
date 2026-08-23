import fs from "node:fs";
import readline from "node:readline";
import { getDicDb } from "../../db.js";
import {
    definitionsTable,
    examplesTable,
    wordPosesTable,
    wordsTable,
} from "../../schema/dictionary/dic.js";
import { DefinitionInsert, ExampleInsert, WordInsert, WordPosInsert } from "../../schema/dictionary/dic-schema-infers.js";
import { sql } from "drizzle-orm";
import Database from "better-sqlite3";
import Logger from "electron-log/main.js";
import { DicImpProgress as DicImpProgress, DicImpResult, ImportResult } from "./dic-import-types.js";

export type WordRow = WordInsert;
export type WordPosRow = WordPosInsert;
export type DefinitionRow = DefinitionInsert;
export type ExampleRow = ExampleInsert;

export enum DicImpRowType {
    Word = 0,
    WordPose = 1,
    Definition = 2,
    Example = 3,
}

type TypedWordRow = WordRow & { type: DicImpRowType.Word };
type TypedWordPosRow = WordPosRow & { type: DicImpRowType.WordPose };
type TypedDefinitionRow = DefinitionRow & { type: DicImpRowType.Definition };
type TypedExampleRow = ExampleRow & { type: DicImpRowType.Example };
export type DictImportRow = TypedWordRow | TypedWordPosRow | TypedDefinitionRow | TypedExampleRow;

type DicImpProgressReporter = (progress: DicImpProgress) => void;

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

async function upsertBatch<TRow>(
    batch: TRow[],
    upsertRowsFn: (rows: TRow[]) => Promise<Database.RunResult>,
    totalImportResult: ImportResult,
    filePath: string,
    sectionImportResult?: ImportResult,
) {
    let result: Database.RunResult;
    try {
        result = await upsertRowsFn(batch);
        totalImportResult.processed += result.changes;
        if (sectionImportResult) {
            sectionImportResult.processed += result.changes;
        }
    } catch (error) {
        Logger.error(
            `Database error processing line ${totalImportResult.total} in ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
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
        totalImportResult.failed += 1;
        if (sectionImportResult) {
            sectionImportResult.failed += 1;
        }
    }
}

function isWordImpRow(row: Partial<WordRow>): row is WordRow {
    return Boolean(
        Number.isInteger(row.wordId)
        && row.spelling
        && Number.isInteger(row.entryVersion)
        && row.entryVersion! > 0,
    );
}

function isWordPosImportRow(row: Partial<WordPosRow>): row is WordPosRow {
    return Boolean(Number.isInteger(row.poseId) && Number.isInteger(row.wordId));
}

function isDefinitionImpRow(row: Partial<DefinitionRow>): row is DefinitionRow {
    return Boolean(Number.isInteger(row.defId) && Number.isInteger(row.wordPosId));
}

function isExampleImpRow(row: Partial<ExampleRow>): row is ExampleRow {
    return Boolean(Number.isInteger(row.expId) && Number.isInteger(row.defId) && row.exSrc);
}

function isDicImpRow(row: Partial<DictImportRow>): row is DictImportRow {
    switch (row.type) {
        case DicImpRowType.Word:
            return isWordImpRow(row);
        case DicImpRowType.WordPose:
            return isWordPosImportRow(row);
        case DicImpRowType.Definition:
            return isDefinitionImpRow(row);
        case DicImpRowType.Example:
            return isExampleImpRow(row);
        default:
            return false;
    }
}

function stripType<TRow extends { type: DicImpRowType }>(row: TRow): Omit<TRow, "type"> {
    const { type: _type, ...data } = row;
    return data;
}

async function upsertWords(rows: WordRow[]): Promise<Database.RunResult> {
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
}

async function upsertWordPoses(rows: WordPosRow[]): Promise<Database.RunResult> {
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
}

async function upsertDefinitions(rows: DefinitionRow[]): Promise<Database.RunResult> {
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
}

async function upsertExamples(rows: ExampleRow[]): Promise<Database.RunResult> {
    const db = getDicDb();
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
}

export async function impDictionaryDetailed(
    filePath: string,
    reportProgress?: DicImpProgressReporter,
): Promise<DicImpResult> {
    
    const impResult = createImportResult();
    const detailedResult: DicImpResult = {
        total: impResult,
        words: createImportResult(),
        wordPoses: createImportResult(),
        definitions: createImportResult(),
        examples: createImportResult(),
    };
    let lineReader;
    try {
        lineReader = createLineReader(filePath);
    } catch (error) {
        Logger.error(
            `Failed to create line reader for file ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
        );
        impResult.total = -1;
        detailedResult.words.total = -1;
        return detailedResult;
    }

    let stage: DicImpRowType = DicImpRowType.Word;
    let activeType = DicImpRowType.Word;
    let activeResult = getDetailedImportResult(detailedResult, activeType);
    let batch: DictImportRow[] = [];

    for await (const line of lineReader) {
        impResult.total += 1;
        const trimmedStr = line.trim();

        if (!trimmedStr) {
            activeResult.total += 1;
            continue;
        }

        let row: Partial<DictImportRow>;
        try {
            row = JSON.parse(trimmedStr) as Partial<DictImportRow>;
        } catch (error) {
            Logger.error(
                `Abort dictionary import: invalid JSON at line ${impResult.total} in ${filePath}${error instanceof Error ? ` (${error.message})` : ""}`,
            );
            impResult.failed += 1;
            activeResult.total += 1;
            activeResult.failed += 1;
            await flushDicBatch(activeType, batch, impResult, activeResult, filePath);
            batch = [];
            finalizeImportResult(detailedResult);
            return detailedResult;
        }

        if (isDictionaryImportRowType(row.type) && row.type > activeType) {
            await flushDicBatch(activeType, batch, impResult, activeResult, filePath);
            batch = [];
            activeType = row.type;
            activeResult = getDetailedImportResult(detailedResult, activeType);
            if (stage !== activeType) {
                reportProgress?.(dicImpProgress(activeType));
                stage = activeType;
            }
        }

        if (!isDicImpRow(row) || row.type < activeType) {
            Logger.error(`Abort dictionary import: invalid row type/order/data at line ${impResult.total} in ${filePath}`);
            impResult.failed += 1;
            activeResult.total += 1;
            activeResult.failed += 1;
            await flushDicBatch(activeType, batch, impResult, activeResult, filePath);
            batch = [];
            finalizeImportResult(detailedResult);
            return detailedResult;
        }

        activeResult.total += 1;
        batch.push(row);
        if (batch.length >= 1000) {
            await flushDicBatch(activeType, batch, impResult, activeResult, filePath);
            batch = [];
        }
    }

    await flushDicBatch(activeType, batch, impResult, activeResult, filePath);
    finalizeImportResult(detailedResult);
    return detailedResult;
}

function finalizeImportResult(result: DicImpResult): void {
    result.total.skipped = result.total.total - (result.total.processed + result.total.failed);
    updateDetailedSkipped(result);
}

function createImportResult(): ImportResult {
    return {
        total: 0,
        processed: 0,
        skipped: 0,
        failed: 0,
    };
}

function updateDetailedSkipped(result: DicImpResult): void {
    result.words.skipped = result.words.total - (result.words.processed + result.words.failed);
    result.wordPoses.skipped = result.wordPoses.total - (result.wordPoses.processed + result.wordPoses.failed);
    result.definitions.skipped = result.definitions.total - (result.definitions.processed + result.definitions.failed);
    result.examples.skipped = result.examples.total - (result.examples.processed + result.examples.failed);
}

function getDetailedImportResult(
    result: DicImpResult,
    type: DicImpRowType,
): ImportResult {
    switch (type) {
        case DicImpRowType.WordPose:
            return result.wordPoses;
        case DicImpRowType.Definition:
            return result.definitions;
        case DicImpRowType.Example:
            return result.examples;
        case DicImpRowType.Word:
        default:
            return result.words;
    }
}

function isDictionaryImportRowType(value: unknown): value is DicImpRowType {
    return value === DicImpRowType.Word
        || value === DicImpRowType.WordPose
        || value === DicImpRowType.Definition
        || value === DicImpRowType.Example;
}

function dicImpProgress(type: DicImpRowType): DicImpProgress {
    switch (type) {
        case DicImpRowType.WordPose:
            return { progress: 25, stage: "wordPoses" };
        case DicImpRowType.Definition:
            return { progress: 50, stage: "definitions" };
        case DicImpRowType.Example:
            return { progress: 75, stage: "examples" };
        case DicImpRowType.Word:
        default:
            return { progress: 0, stage: "words" };
    }
}

async function flushDicBatch(
    type: DicImpRowType,
    rows: DictImportRow[],
    importResult: ImportResult,
    detailedImportResult: ImportResult,
    filePath: string,
): Promise<void> {
    if (rows.length === 0) {
        return;
    }

    switch (type) {
        case DicImpRowType.Word:
            await upsertBatch(rows.map((row) => stripType(row as TypedWordRow)), upsertWords, importResult, filePath, detailedImportResult);
            break;
        case DicImpRowType.WordPose:
            await upsertBatch(rows.map((row) => stripType(row as TypedWordPosRow)), upsertWordPoses, importResult, filePath, detailedImportResult);
            break;
        case DicImpRowType.Definition:
            await upsertBatch(rows.map((row) => stripType(row as TypedDefinitionRow)), upsertDefinitions, importResult, filePath, detailedImportResult);
            break;
        case DicImpRowType.Example:
            await upsertBatch(rows.map((row) => stripType(row as TypedExampleRow)), upsertExamples, importResult, filePath, detailedImportResult);
            break;
    }
}
