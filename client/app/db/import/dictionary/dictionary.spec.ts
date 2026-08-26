import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";

import { dictionarySchema, getDicDb } from "@main/db/db.js";
import { definitionsTable, examplesTable, wordPosesTable, wordsTable } from "../../schema/dictionary/dic.js";
import { DicImpRowType, impDictionaryDetailed } from "./index.js";
import { ImportResult } from "./dic-import-types.js";
import { createSchema, writeJsonLinesFile } from "./test-helpers.js";

vi.mock(import("@main/db/db.js"), async (importOriginal) => {
    const mod = await importOriginal();
    return {
        dictionarySchema: mod.dictionarySchema,
        getDicDb: vi.fn(),
    };
});

describe("Dictionary Import Single File Tests", () => {
    const mockedGetDicDb = vi.mocked(getDicDb);

    let sqlite: Database.Database;
    let db: BetterSQLite3Database<typeof dictionarySchema>;
    let tempDir: string;

    beforeEach(() => {
        sqlite = new Database(":memory:");
        db = drizzle(sqlite, { schema: dictionarySchema });
        createSchema(sqlite, db);
        mockedGetDicDb.mockReturnValue(db);
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dictionary-import-"));
    });

    afterEach(() => {
        mockedGetDicDb.mockReset();
        sqlite?.close();
        if (tempDir) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    it("imports one ordered typed JSONL into all dictionary tables", async () => {
        const rows = [
            {
                type: DicImpRowType.Word,
                wordId: 1,
                spelling: "run",
                entryVersion: 1,
                phoneticBre: "run",
                phoneticAme: "run",
                createdAt: 100,
                updatedAt: 200,
            },
            {
                type: DicImpRowType.WordPose,
                poseId: 1,
                wordId: 1,
                partOfSpeech: "verb",
                createdAt: 300,
                updatedAt: 400,
            },
            {
                type: DicImpRowType.Definition,
                defId: 1,
                wordPosId: 1,
                defSrc: "to move quickly",
                defTgt: "跑",
                createdAt: 500,
                updatedAt: 600,
            },
            {
                type: DicImpRowType.Example,
                expId: 1,
                defId: 1,
                exSrc: "I run every day.",
                exTgt: "我每天跑步。",
                createdAt: 700,
                updatedAt: 800,
            },
        ];
        const filePath = writeJsonLinesFile(tempDir!, "dictionary.jsonl", rows);

        const result = await impDictionaryDetailed(filePath);

        expect(result.total).toEqual<ImportResult>({
            processed: 4,
            skipped: 0,
            failed: 0,
            total: 4,
        });
        expect(result.words).toEqual<ImportResult>({ processed: 1, skipped: 0, failed: 0, total: 1 });
        expect(result.wordPoses).toEqual<ImportResult>({ processed: 1, skipped: 0, failed: 0, total: 1 });
        expect(result.definitions).toEqual<ImportResult>({ processed: 1, skipped: 0, failed: 0, total: 1 });
        expect(result.examples).toEqual<ImportResult>({ processed: 1, skipped: 0, failed: 0, total: 1 });
        expect(await db.select().from(wordsTable)).toHaveLength(1);
        expect(await db.select().from(wordPosesTable)).toHaveLength(1);
        expect(await db.select().from(definitionsTable)).toHaveLength(1);
        expect(await db.select().from(examplesTable)).toHaveLength(1);
    });

    it("rejects rows whose type moves backward", async () => {
        const rows = [
            {
                type: DicImpRowType.Word,
                wordId: 1,
                spelling: "run",
                entryVersion: 1,
                createdAt: 100,
                updatedAt: 200,
            },
            {
                type: DicImpRowType.WordPose,
                poseId: 1,
                wordId: 1,
                partOfSpeech: "verb",
                createdAt: 300,
                updatedAt: 400,
            },
            {
                type: DicImpRowType.Word,
                wordId: 2,
                spelling: "late",
                entryVersion: 1,
                createdAt: 500,
                updatedAt: 600,
            },
        ];
        const filePath = writeJsonLinesFile(tempDir, "dictionary-out-of-order.jsonl", rows);

        const result = await impDictionaryDetailed(filePath);

        expect(result.total).toEqual<ImportResult>({
            processed: 2,
            skipped: 0,
            failed: 1,
            total: 3,
        });
        expect(result.words).toEqual<ImportResult>({ processed: 1, skipped: 0, failed: 0, total: 1 });
        expect(result.wordPoses).toEqual<ImportResult>({ processed: 1, skipped: 0, failed: 1, total: 2 });
        expect(result.definitions).toEqual<ImportResult>({ processed: 0, skipped: 0, failed: 0, total: 0 });
        expect(result.examples).toEqual<ImportResult>({ processed: 0, skipped: 0, failed: 0, total: 0 });
        expect(await db.select().from(wordsTable)).toHaveLength(1);
        expect(await db.select().from(wordPosesTable)).toHaveLength(1);
    });
});
