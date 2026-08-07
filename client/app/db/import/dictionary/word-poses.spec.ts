import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import { dictionarySchema, getDicDb } from "@main/db/db";
import { wordPosesTable } from "../../schema/dictionary/dic";
import { impWordPoses, impWords } from ".";
import { createSchema, writeJsonLinesFile } from "./test-helpers";
import { ImportResult } from "./dic-import-types";

vi.mock(import("@main/db/db"), async (importOriginal) => {
    const mod = await importOriginal();
    return {
        dictionarySchema: mod.dictionarySchema,
        getDicDb: vi.fn(),
    };
});

describe("Dictionary Import Word Poses Tests", () => {
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

    it("imports word poses into the in-memory dictionary database", async () => {
        const words = [
            {
                word_id: 1,
                spelling: "run",
                entry_version: 1,
                phonetic_bre: "run",
                phonetic_ame: "run",
                created_at: 100,
                updated_at: 200,
            },
        ];
        await impWords(writeJsonLinesFile(tempDir, "seed-words.jsonl", words));

        const poses = [
            {
                pose_id: 1,
                word_id: words[0].word_id,
                part_of_speech: "verb",
                created_at: 500,
                updated_at: 600,
            },
        ];
        const filePath = writeJsonLinesFile(tempDir, "word-poses.jsonl", poses);

        const result = await impWordPoses(filePath);

        expect(result).toEqual<ImportResult>({
            processed: 1,
            skipped: 0,
            failed: 0,
            total: 1
        });

        const rows = await db.select().from(wordPosesTable);

        expect(rows).toHaveLength(1);
        expect(rows[0].poseId).toBe(1);
        expect(rows[0].wordId).toBe(1);
        expect(rows[0].partOfSpeech).toBe("verb");
        expect(rows[0].createdAt).toBe(500);
        expect(rows[0].updatedAt).toBe(600);
    });

    it("imports wrong foreign key word poses into the in-memory dictionary database", async () => {
        const poses = [
            {
                pose_id: 1,
                // This word_id does not exist in the words table
                word_id: 404, 
                part_of_speech: "verb",
                created_at: 500,
                updated_at: 600,
            },
        ];
        const filePath = writeJsonLinesFile(tempDir, "word-poses.jsonl", poses);

        const result = await impWordPoses(filePath);

        expect(result).toEqual<ImportResult>({
            processed: 0,
            skipped: 0,
            failed: 1,
            total: 1
        });

        const rows = await db.select().from(wordPosesTable);
        expect(rows).toHaveLength(0);
    });
});
