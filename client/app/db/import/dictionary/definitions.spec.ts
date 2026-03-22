import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import { dictionarySchema, getDicDb } from '../../db';
import { definitionsTable } from '../../schema/dictionary';
import { importDefinitions, importWordPoses, importWords } from '.';
import { createSchema, writeJsonLinesFile } from './test-helpers';
import { bufferToHex } from '../utils';

vi.mock('../../db', () => ({
    dictionarySchema: vi.importActual("../../db"),
    getDicDb: vi.fn(),
}));

describe('Dictionary Import Definitions Tests', () => {
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

    it('imports definitions into the in-memory dictionary database', async () => {
        const words = [
            {
                word_id: '55555555-5555-5555-5555-555555555555',
                spelling: 'bright',
                fingerprint: 'abcdefabcdefabcdefabcdefabcdefab',
                phonetic_bre: 'brite',
                phonetic_ame: 'brite',
                created_at: 100,
                updated_at: 200,
            },
        ];
        const poses = [
            {
                pose_id: '66666666-6666-6666-6666-666666666666',
                word_id: words[0].word_id,
                part_of_speech: 'adjective',
                created_at: 300,
                updated_at: 400,
            },
        ];
        await importWords(writeJsonLinesFile(tempDir, 'seed-words.jsonl', words));
        await importWordPoses(writeJsonLinesFile(tempDir, 'seed-word-poses.jsonl', poses));

        // definitions.jsonl
        const definitions = [
            {
                def_id: '77777777-7777-7777-7777-777777777777',
                word_pos_id: poses[0].pose_id,
                def_src: 'giving out or reflecting much light',
                def_tgt: 'bright',
                created_at: 700,
                updated_at: 800,
            },
        ];
        const filePath = writeJsonLinesFile(tempDir, 'definitions.jsonl', definitions);

        const result = await importDefinitions(filePath);

        expect(result).toEqual({
            source: filePath,
            processed: 1,
            skipped: 0,
            failed: 0,
        });

        const rows = await db.select().from(definitionsTable);

        expect(rows).toHaveLength(1);
        expect(bufferToHex(rows[0].defId)).toBe('77777777777777777777777777777777');
        expect(bufferToHex(rows[0].wordPosId)).toBe('66666666666666666666666666666666');
        expect(rows[0].defSrc).toBe('giving out or reflecting much light');
        expect(rows[0].defTgt).toBe('bright');
        expect(rows[0].createdAt).toBe(700);
        expect(rows[0].updatedAt).toBe(800);
    });
});
