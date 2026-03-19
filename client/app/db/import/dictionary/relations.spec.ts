import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import { getDicDb } from '../../db';
import {
    definitionsTable,
    examplesTable,
    wordPosesTable,
} from '../../schema/dictionary';
import {
    importDefinitions,
    importExamples,
    importWordPoses,
    importWords,
} from '.';
import { createSchema, writeJsonLinesFile } from './test-helpers';
import { bufferToHex } from '../utils';

vi.mock('../db', () => ({
    getDicDb: vi.fn(),
}));

describe('Dictionary Import Relations Tests', () => {
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
            invalidRow: 0,
        });

        const rows = await db.select().from(wordPosesTable);

        expect(rows).toHaveLength(1);
        expect(bufferToHex(rows[0].poseId)).toBe('44444444444444444444444444444444');
        expect(bufferToHex(rows[0].wordId)).toBe('33333333333333333333333333333333');
        expect(rows[0].partOfSpeech).toBe('verb');
        expect(rows[0].createdAt).toBe(500);
        expect(rows[0].updatedAt).toBe(600);
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
            invalidRow: 0,
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
            invalidRow: 0,
        });

        const rows = await db.select().from(examplesTable);

        expect(rows).toHaveLength(1);
        expect(bufferToHex(rows[0].expId)).toBe('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
        expect(bufferToHex(rows[0].defId)).toBe('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
        expect(rows[0].exSrc).toBe('Children learn quickly.');
        expect(rows[0].exTgt).toBe('Kids learn quickly.');
        expect(rows[0].createdAt).toBe(900);
        expect(rows[0].updatedAt).toBe(1000);
    });
});
