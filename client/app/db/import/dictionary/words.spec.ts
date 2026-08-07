import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { asc } from "drizzle-orm";
import { BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";

import { wordsTable } from "../../schema/dictionary/dic";
import { impWords } from ".";
import { createSchema, writeJsonLinesFile, writeRawLinesFile } from "./test-helpers";
import { ImportResult } from "./dic-import-types";
import { dictionarySchema, getDicDb } from "@main/db/db";

vi.mock(import("@main/db/db"), async (importOriginal) => {
    const mod = await importOriginal();
    return {
        dictionarySchema: mod.dictionarySchema,
        getDicDb: vi.fn(),
    };
});

interface WordJsonLine {
    word_id: number;
    spelling: string;
    entry_version: number;
    phonetic_bre?: string | null;
    phonetic_ame?: string | null;
    created_at: number;
    updated_at: number;
}

function toExpectedWordRecord(row: WordJsonLine): {
    wordId: number;
    spelling: string;
    entryVersion: number;
    phoneticBre: string | null;
    phoneticAme: string | null;
    createdAt: number;
    updatedAt: number;
} {
    return {
        wordId: row.word_id,
        spelling: row.spelling,
        entryVersion: row.entry_version,
        phoneticBre: row.phonetic_bre ?? null,
        phoneticAme: row.phonetic_ame ?? null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

describe("Dictionary Import Words Tests", () => {
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
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it("fail to find the file", async () => {
        const filePath = path.join(tempDir, "nonexistent.jsonl");

        const result = await impWords(filePath);
        expect(result.total).toBe(-1);
    });

    it("imports words into the in-memory dictionary database", async () => {
        const words = [
            {
                word_id: 1,
                spelling: "hello",
                entry_version: 1,
                phonetic_bre: "heh-loh",
                phonetic_ame: "heh-loh",
                created_at: 100,
                updated_at: 200,
            },
            {
                word_id: 2,
                spelling: "world",
                entry_version: 1,
                phonetic_bre: null,
                phonetic_ame: null,
                created_at: 300,
                updated_at: 400,
            },
        ];
        const filePath = writeJsonLinesFile(tempDir, "words.jsonl", words);

        const result = await impWords(filePath);

        expect(result).toEqual<ImportResult>({
            processed: 2,
            skipped: 0,
            failed: 0,
            total: 2
        });

        // Select and verify the inserted rows in the database
        const rows = await db
            .select()
            .from(wordsTable)
            .orderBy(asc(wordsTable.spelling));

        const expectedRows = words
            .map(toExpectedWordRecord)
            .sort((a, b) => a.spelling.localeCompare(b.spelling));
        expect(rows).toEqual(expectedRows);
    });

    it("counts processed, skipped, and failed in a mixed words import file", async () => {
        const existing = {
            word_id: 1,
            spelling: "active",
            entry_version: 1,
            phonetic_bre: "ak-tiv",
            phonetic_ame: "ak-tiv",
            created_at: 100,
            updated_at: 300,
        };
        await impWords(writeJsonLinesFile(tempDir, "seed-words.jsonl", [existing]));

        const validInsert = {
            word_id: 2,
            spelling: "fresh",
            entry_version: 2,
            phonetic_bre: "fresh",
            phonetic_ame: "fresh",
            created_at: 400,
            updated_at: 500,
        };
        const outdatedConflict = {
            ...existing,
            spelling: "active-old",
            updated_at: 200,
        };
        const wrongTypeRow = {
            word_id: 3,
            spelling: "broken",
            created_at: 700,
            updated_at: 800,
        };
        const filePath = writeRawLinesFile(tempDir, "words-mixed-stats.jsonl", [
            JSON.stringify(validInsert),
            "",
            JSON.stringify(outdatedConflict),
            JSON.stringify(wrongTypeRow),
            "{\"invalid_json\":",
        ]);

        const result = await impWords(filePath);

        expect(result).toEqual<ImportResult>({
            processed: 1,
            skipped: 2,
            failed: 2,
            total: 5
        });

        const rows = await db
            .select()
            .from(wordsTable)
            .orderBy(asc(wordsTable.spelling));
        expect(rows).toHaveLength(2);
        expect(rows.map((row) => row.spelling)).toEqual(["active", "fresh"]);
    });

    it("counts only blank and invalid rows when no valid word rows exist", async () => {
        const wrongTypeRow = {
            word_id: 1,
            spelling: "missing-entry-version",
            created_at: 100,
            updated_at: 200,
        };
        const filePath = writeRawLinesFile(tempDir, "words-invalid-only.jsonl", [
            "",
            "{\"bad_json\":",
            JSON.stringify(wrongTypeRow),
        ]);

        const result = await impWords(filePath);

        expect(result).toEqual<ImportResult>({
            processed: 0,
            skipped: 1,
            failed: 2,
            total: 3
        });

        const rows = await db.select().from(wordsTable);
        expect(rows).toHaveLength(0);
    });
});
