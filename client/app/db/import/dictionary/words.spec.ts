import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { asc } from 'drizzle-orm';
import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import { getDicDb } from '../../db';
import { wordsTable } from '../../schema/dictionary';
import { importWords } from '.';
import { createSchema, writeJsonLinesFile } from './test-helpers';
import { hexToBuffer, uuidToBuffer } from '../utils';

vi.mock('../db', () => ({
    getDicDb: vi.fn(),
}));

function toExpectedWordRecord(row: any): {
    wordId: Buffer;
    spelling: string;
    fingerprint: Buffer;
    phoneticBre: string | null;
    phoneticAme: string | null;
    createdAt: number;
    updatedAt: number;
} {
    return {
        wordId: uuidToBuffer(row.word_id),
        spelling: row.spelling,
        fingerprint: hexToBuffer(row.fingerprint),
        phoneticBre: row.phonetic_bre ?? null,
        phoneticAme: row.phonetic_ame ?? null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

describe('Dictionary Import Words Tests', () => {
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

    it('imports words into the in-memory dictionary database', async () => {
        const words = [
            {
                word_id: '11111111-1111-1111-1111-111111111111',
                spelling: 'hello',
                fingerprint: '00112233445566778899aabbccddeeff',
                phonetic_bre: 'heh-loh',
                phonetic_ame: 'heh-loh',
                created_at: 100,
                updated_at: 200,
            },
            {
                word_id: '22222222-2222-2222-2222-222222222222',
                spelling: 'world',
                fingerprint: 'ffeeddccbbaa99887766554433221100',
                phonetic_bre: null,
                phonetic_ame: null,
                created_at: 300,
                updated_at: 400,
            },
        ];
        const filePath = writeJsonLinesFile(tempDir, 'words.jsonl', words);

        const result = await importWords(filePath);

        expect(result).toEqual({
            source: filePath,
            processed: 2,
            skipped: 0,
            invalidRow: 0,
        });

        const rows = await db
            .select()
            .from(wordsTable)
            .orderBy(asc(wordsTable.spelling));

        const expectedRows = words
            .map(toExpectedWordRecord)
            .sort((a, b) => a.spelling.localeCompare(b.spelling));
        expect(rows).toEqual(expectedRows);
    });
});
