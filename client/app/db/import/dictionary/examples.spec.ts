import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import { dictionarySchema, getDicDb } from '../../db';
import { examplesTable } from '../../schema/dictionary';
import {
    importDefinitions,
    importExamples,
    importWordPoses,
    importWords,
} from '.';
import { createSchema, writeJsonLinesFile } from './test-helpers';
import { bufferToHex } from '../utils';

vi.mock('../../db', () => ({
    dictionarySchema: vi.importActual("../../db"),
    getDicDb: vi.fn(),
}));

describe('Dictionary Import Examples Tests', () => {
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

    it('imports examples into the in-memory dictionary database', async () => {
        const words = [
            {
                word_id: '88888888-8888-8888-8888-888888888888',
                spelling: 'learn',
                fingerprint: '11223344556677889900aabbccddeeff',
                phonetic_bre: 'lern',
                phonetic_ame: 'lern',
                created_at: 100,
                updated_at: 200,
            },
        ];
        const poses = [
            {
                pose_id: '99999999-9999-9999-9999-999999999999',
                word_id: words[0].word_id,
                part_of_speech: 'verb',
                created_at: 300,
                updated_at: 400,
            },
        ];
        const definitions = [
            {
                def_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                word_pos_id: poses[0].pose_id,
                def_src: 'to gain knowledge or skill',
                def_tgt: 'study',
                created_at: 500,
                updated_at: 600,
            },
        ];
        await importWords(writeJsonLinesFile(tempDir, 'seed-words.jsonl', words));
        await importWordPoses(writeJsonLinesFile(tempDir, 'seed-word-poses.jsonl', poses));
        await importDefinitions(writeJsonLinesFile(tempDir, 'seed-definitions.jsonl', definitions));

        // examples.jsonl
        const examples = [
            {
                exp_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                def_id: definitions[0].def_id,
                ex_src: 'Children learn quickly.',
                ex_tgt: 'Kids learn quickly.',
                created_at: 900,
                updated_at: 1000,
            },
        ];
        const filePath = writeJsonLinesFile(tempDir, 'examples.jsonl', examples);

        const result = await importExamples(filePath);

        expect(result).toEqual({
            source: filePath,
            processed: 1,
            skipped: 0,
            failed: 0,
        });

        const exp_rows = await db.select().from(examplesTable);

        expect(exp_rows).toHaveLength(1);
        expect(bufferToHex(exp_rows[0].expId)).toBe('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
        expect(bufferToHex(exp_rows[0].defId)).toBe('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
        expect(exp_rows[0].exSrc).toBe('Children learn quickly.');
        expect(exp_rows[0].exTgt).toBe('Kids learn quickly.');
        expect(exp_rows[0].createdAt).toBe(900);
        expect(exp_rows[0].updatedAt).toBe(1000);
    });
});
