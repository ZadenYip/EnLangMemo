import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { asc } from 'drizzle-orm';
import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import { getDicDb } from '../../db';
import { wordsTable } from '../../schema/dictionary';
import { importWords } from '.';
import { createSchema, writeJsonLinesFile, writeRawLinesFile } from './test-helpers';

vi.mock('../db', () => ({
    getDicDb: vi.fn(),
}));

describe('Dictionary Import Result Tests', () => {
    const mockedGetDicDb = vi.mocked(getDicDb);

    let sqlite: Database.Database;
    let db: BetterSQLite3Database;
    let tempDir: string;

    beforeEach(() => {
        sqlite = new Database(':memory:');
        db = drizzle(sqlite);
        createSchema(sqlite, db);
        mockedGetDicDb.mockReturnValue(db);
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dictionary-import-'));
    });

    afterEach(() => {
        mockedGetDicDb.mockReset();
        sqlite?.close();
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('counts processed, skipped, and invalidRow in a mixed words import file', async () => {
        const existing = {
            word_id: '12121212-1212-1212-1212-121212121212',
            spelling: 'active',
            fingerprint: '00112233445566778899aabbccddeeff',
            phonetic_bre: 'ak-tiv',
            phonetic_ame: 'ak-tiv',
            created_at: 100,
            updated_at: 300,
        };
        await importWords(writeJsonLinesFile(tempDir, 'seed-words.jsonl', [existing]));

        const validInsert = {
            word_id: '34343434-3434-3434-3434-343434343434',
            spelling: 'fresh',
            fingerprint: 'ffeeddccbbaa99887766554433221100',
            phonetic_bre: 'fresh',
            phonetic_ame: 'fresh',
            created_at: 400,
            updated_at: 500,
        };
        const outdatedConflict = {
            ...existing,
            spelling: 'active-old',
            updated_at: 200,
        };
        const wrongTypeRow = {
            word_id: '56565656-5656-5656-5656-565656565656',
            spelling: 'broken',
            created_at: 700,
            updated_at: 800,
        };
        const filePath = writeRawLinesFile(tempDir, 'words-mixed-stats.jsonl', [
            JSON.stringify(validInsert),
            '',
            JSON.stringify(outdatedConflict),
            JSON.stringify(wrongTypeRow),
            '{"invalid_json":',
        ]);

        const result = await importWords(filePath);

        expect(result).toEqual({
            source: filePath,
            processed: 1,
            skipped: 2,
            invalidRow: 2,
        });

        const rows = await db
            .select()
            .from(wordsTable)
            .orderBy(asc(wordsTable.spelling));
        expect(rows).toHaveLength(2);
        expect(rows.map((row) => row.spelling)).toEqual(['active', 'fresh']);
    });

    it('counts only blank and invalid rows when no valid word rows exist', async () => {
        const wrongTypeRow = {
            word_id: '78787878-7878-7878-7878-787878787878',
            spelling: 'missing-fingerprint',
            created_at: 100,
            updated_at: 200,
        };
        const filePath = writeRawLinesFile(tempDir, 'words-invalid-only.jsonl', [
            '',
            '{"bad_json":',
            JSON.stringify(wrongTypeRow),
        ]);

        const result = await importWords(filePath);

        expect(result).toEqual({
            source: filePath,
            processed: 0,
            skipped: 1,
            invalidRow: 2,
        });

        const rows = await db.select().from(wordsTable);
        expect(rows).toHaveLength(0);
    });
});
