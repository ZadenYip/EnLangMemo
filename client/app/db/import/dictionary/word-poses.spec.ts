import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import { dictionarySchema, getDicDb } from '../../db';
import { wordPosesTable } from '../../schema/dictionary';
import { importWordPoses, importWords } from '.';
import { createSchema, writeJsonLinesFile } from './test-helpers';
import { bufferToHex } from '../utils';

vi.mock('../../db', () => ({
    dictionarySchema: vi.importActual("../../db"),
    getDicDb: vi.fn(),
}));

describe('Dictionary Import Word Poses Tests', () => {
    const mockedGetDicDb = vi.mocked(getDicDb);

    let sqlite: Database.Database;
    let db: BetterSQLite3Database<typeof dictionarySchema>;
    let tempDir: string;

    beforeEach(() => {
        sqlite = new Database(':memory:');
        db = drizzle(sqlite, { schema: dictionarySchema });
        createSchema(sqlite, db);
        mockedGetDicDb.mockReturnValue(db);
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dictionary-import-'));
    });

    afterEach(() => {
        mockedGetDicDb.mockReset();
        sqlite?.close();
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('imports word poses into the in-memory dictionary database', async () => {
        const words = [
            {
                word_id: '33333333-3333-3333-3333-333333333333',
                spelling: 'run',
                fingerprint: '1234567890abcdef1234567890abcdef',
                phonetic_bre: 'run',
                phonetic_ame: 'run',
                created_at: 100,
                updated_at: 200,
            },
        ];
        await importWords(writeJsonLinesFile(tempDir, 'seed-words.jsonl', words));

        const poses = [
            {
                pose_id: '44444444-4444-4444-4444-444444444444',
                word_id: words[0].word_id,
                part_of_speech: 'verb',
                created_at: 500,
                updated_at: 600,
            },
        ];
        const filePath = writeJsonLinesFile(tempDir, 'word-poses.jsonl', poses);

        const result = await importWordPoses(filePath);

        expect(result).toEqual({
            source: filePath,
            processed: 1,
            skipped: 0,
            failed: 0,
        });

        const rows = await db.select().from(wordPosesTable);

        expect(rows).toHaveLength(1);
        expect(bufferToHex(rows[0].poseId)).toBe('44444444444444444444444444444444');
        expect(bufferToHex(rows[0].wordId)).toBe('33333333333333333333333333333333');
        expect(rows[0].partOfSpeech).toBe('verb');
        expect(rows[0].createdAt).toBe(500);
        expect(rows[0].updatedAt).toBe(600);
    });

    it('imports wrong foreign key word poses into the in-memory dictionary database', async () => {
        const poses = [
            {
                pose_id: '44444444-4444-4444-4444-444444444444',
                // This word_id does not exist in the words table
                word_id: '33333333-3333-3333-3333-333333333333', 
                part_of_speech: 'verb',
                created_at: 500,
                updated_at: 600,
            },
        ];
        const filePath = writeJsonLinesFile(tempDir, 'word-poses.jsonl', poses);

        const result = await importWordPoses(filePath);

        expect(result).toEqual({
            source: filePath,
            processed: 0,
            skipped: 0,
            failed: 1,
        });

        const rows = await db.select().from(wordPosesTable);
        expect(rows).toHaveLength(0);
    });
});
