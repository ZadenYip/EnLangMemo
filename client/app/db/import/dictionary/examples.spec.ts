import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import { dictionarySchema, getDicDb } from "../../db";
import { examplesTable } from "../../schema/dictionary/dic";
import {
    impDefinitions,
    impExamples,
    impWordPoses,
    impWords,
} from ".";
import { createSchema, writeJsonLinesFile } from "./test-helpers";
import { ImportResult } from "./dic-import-types";

vi.mock(import("@main/db/db"), async (importOriginal) => {
    const mod = await importOriginal();
    return {
        dictionarySchema: mod.dictionarySchema,
        getDicDb: vi.fn(),
    };
});

describe("Dictionary Import Examples Tests", () => {
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

    it("imports examples into the in-memory dictionary database", async () => {
        const words = [
            {
                word_id: 1,
                spelling: "learn",
                entry_version: 1,
                phonetic_bre: "lern",
                phonetic_ame: "lern",
                created_at: 100,
                updated_at: 200,
            },
        ];
        const poses = [
            {
                pose_id: 1,
                word_id: words[0].word_id,
                part_of_speech: "verb",
                created_at: 300,
                updated_at: 400,
            },
        ];
        const definitions = [
            {
                def_id: 1,
                word_pos_id: poses[0].pose_id,
                def_src: "to gain knowledge or skill",
                def_tgt: "study",
                created_at: 500,
                updated_at: 600,
            },
        ];
        await impWords(writeJsonLinesFile(tempDir, "seed-words.jsonl", words));
        await impWordPoses(writeJsonLinesFile(tempDir, "seed-word-poses.jsonl", poses));
        await impDefinitions(writeJsonLinesFile(tempDir, "seed-definitions.jsonl", definitions));

        // examples.jsonl
        const examples = [
            {
                exp_id: 1,
                def_id: definitions[0].def_id,
                ex_src: "Children learn quickly.",
                ex_tgt: "Kids learn quickly.",
                created_at: 900,
                updated_at: 1000,
            },
        ];
        const filePath = writeJsonLinesFile(tempDir, "examples.jsonl", examples);

        const result = await impExamples(filePath);

        expect(result).toEqual<ImportResult>({
            processed: 1,
            skipped: 0,
            failed: 0,
            total: 1
        });

        const exp_rows = await db.select().from(examplesTable);

        expect(exp_rows).toHaveLength(1);
        expect(exp_rows[0].expId).toBe(1);
        expect(exp_rows[0].defId).toBe(1);
        expect(exp_rows[0].exSrc).toBe("Children learn quickly.");
        expect(exp_rows[0].exTgt).toBe("Kids learn quickly.");
        expect(exp_rows[0].createdAt).toBe(900);
        expect(exp_rows[0].updatedAt).toBe(1000);
    });
});
