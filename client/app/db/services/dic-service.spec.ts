import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import { dictionarySchema, getDicDb, runSQL } from '../db';
import { importDefinitions, importExamples, importWordPoses, importWords } from '../import/dictionary';
import { createSchema } from '../import/dictionary/test-helpers';
import { uuidToBuffer } from '../import/utils';
import { DatabaseService } from './dic-service';

vi.mock('../db', async () => {
    const actual = await vi.importActual<typeof import('../db')>('../db');
    return {
        ...actual,
        getDicDb: vi.fn(),
        runSQL: vi.fn(),
    };
});

interface WordFixtureRow {
    word_id: string;
    spelling: string;
}

interface WordPosFixtureRow {
    pose_id: string;
    word_id: string;
}

interface DefinitionFixtureRow {
    def_id: string;
    word_pos_id: string;
}

interface ExplainPlanRow {
    id: number;
    parent: number;
    notused: number;
    detail: string;
}

describe('Dictionary Service Tests', () => {
    const mockedGetDicDb = vi.mocked(getDicDb);
    const mockedRunSQL = vi.mocked(runSQL);
    const fixturesDir = path.resolve(__dirname, './fixtures');

    let sqlite: Database.Database;
    let db: BetterSQLite3Database<typeof dictionarySchema>;
    let service: DatabaseService;

    // For development/debugging, we can import the full fixtures with more entries.
    // const fulWordsJSLPath = path.resolve(fixturesDir, "full", 'words.jsonl');
    // const fulPosesJSLPath = path.resolve(fixturesDir, "full", 'word_poses.jsonl');
    // const fulDefsPath = path.resolve(fixturesDir, "full", 'definitions.jsonl');
    // const fulExpsJSLPath = path.resolve(fixturesDir, "full", 'examples.jsonl');
    
    const sliceWordsJSLPath = path.resolve(fixturesDir, "slice", 'words.jsonl');
    const slicePosesJSLPath = path.resolve(fixturesDir, "slice", 'word_poses.jsonl');
    const sliceDefsPath = path.resolve(fixturesDir, "slice", 'definitions.jsonl');
    const sliceExpsJSLPath = path.resolve(fixturesDir, "slice", 'examples.jsonl');

    beforeEach(async () => {
        // create in-memory database and import full fixtures for testing
        sqlite = new Database(':memory:');
        db = drizzle(sqlite, { schema: dictionarySchema });
        createSchema(sqlite, db);

        mockedGetDicDb.mockReturnValue(db);
        mockedRunSQL.mockImplementation(() => []);

        await importWords(sliceWordsJSLPath);
        await importWordPoses(slicePosesJSLPath);
        await importDefinitions(sliceDefsPath);
        await importExamples(sliceExpsJSLPath);

        service = new DatabaseService();
    });

    afterEach(() => {
        mockedGetDicDb.mockReset();
        mockedRunSQL.mockReset();
        sqlite.close();
    });

    it('should query dictionary entry from imported fixtures', async () => {
        const result = await service.queryWord('run');

        expect(result).not.toBeNull();
        expect(result?.word).toBe('run');
        expect(result?.senses.length).toBeGreaterThan(0);

        const partsOfSpeech = new Set(result?.senses.map((sense) => sense.partOfSpeech));
        expect(partsOfSpeech.has('verb')).toBe(true);
        expect(partsOfSpeech.has('noun')).toBe(true);

        const definitions = result?.senses.flatMap((sense) => sense.definitions) ?? [];
        expect(definitions.length).toBeGreaterThan(0);

        const definitionWithExamples = definitions.find(
            (definition) => (definition.examples?.length ?? 0) > 0,
        );
        expect(definitionWithExamples).toBeDefined();
        expect(definitionWithExamples?.examples?.[0]?.src).toBeTruthy();
    });

    it('should return null for missing spelling', async () => {
        const result = await service.queryWord('not-exist-word');
        expect(result).toBeNull();
    });

    function readFirstJsonLine<T>(filePath: string): T {
        const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
        const firstLine = lines.find((line) => line.trim().length > 0);
        if (!firstLine) {
            throw new Error(`No JSON lines found in fixture: ${filePath}`);
        }
        return JSON.parse(firstLine) as T;
    }

    function buildExplainPlanAnalysis(
        sqlite: Database.Database,
        sql: string,
        params: unknown[],
    ): ExplainPlanRow[] {
        const explainSql = `EXPLAIN QUERY PLAN ${sql}`;
        const rows = sqlite
            .prepare(explainSql)
            .all(...params) as ExplainPlanRow[];
        // const printableParams = params.map((param) =>
        //     Buffer.isBuffer(param) ? `0x${param.toString('hex')}` : param,
        // );

        // console.info('\n[EXPLAIN QUERY PLAN]');
        // console.info(`SQL: ${sql}`);
        // console.info(`Params: ${JSON.stringify(printableParams)}`);
        // console.info(`Rows: ${JSON.stringify(rows, null, 2)}`);
        return rows;
    }

    it('should use indexes for efficient querying', () => {
        const wordRow = readFirstJsonLine<WordFixtureRow>(sliceWordsJSLPath);
        const poseRow = readFirstJsonLine<WordPosFixtureRow>(slicePosesJSLPath);
        const definitionRow = readFirstJsonLine<DefinitionFixtureRow>(sliceDefsPath);

        const wordsSql = 'SELECT word_id FROM words WHERE spelling = ?';
        const posesSql = 'SELECT pose_id FROM word_poses WHERE word_id = ?';
        const definitionsSql = 'SELECT def_id FROM definitions WHERE word_pos_id = ?';
        const examplesSql = 'SELECT exp_id FROM examples WHERE def_id = ?';

        const wordsPlan = buildExplainPlanAnalysis(sqlite, wordsSql, [wordRow.spelling]);
        const posesPlan = buildExplainPlanAnalysis(sqlite, posesSql, [uuidToBuffer(poseRow.word_id)]);
        const definitionsPlan = buildExplainPlanAnalysis(sqlite, definitionsSql, [uuidToBuffer(definitionRow.word_pos_id)]);
        const examplesPlan = buildExplainPlanAnalysis(sqlite, examplesSql, [uuidToBuffer(definitionRow.def_id)]);

        // Check that the query plans indicate index usage for the relevant columns
        const indexUsagePattern = /SEARCH \w+ USING INDEX/;
        const strMatch = expect.stringMatching(indexUsagePattern);
        expect(wordsPlan.map((row) => row.detail)).toContainEqual(strMatch);
        expect(posesPlan.map((row) => row.detail)).toContainEqual(strMatch);
        expect(definitionsPlan.map((row) => row.detail)).toContainEqual(strMatch);
        expect(examplesPlan.map((row) => row.detail)).toContainEqual(strMatch);

        expect(wordsPlan.length).toBeGreaterThan(0);
        expect(posesPlan.length).toBeGreaterThan(0);
        expect(definitionsPlan.length).toBeGreaterThan(0);
        expect(examplesPlan.length).toBeGreaterThan(0);
    });

    // This test checks the actual SQL generated by queryWord and prints the explain plans for each query.
    //
    // interface LoggedQuery {
    //     sql: string;
    //     params: unknown[];
    // }
    // it('should print explain plans for actual SQL generated by queryWord', async () => {
    //     const loggedQueries: LoggedQuery[] = [];
    //     const loggedSqlite = new Database(':memory:');
    //     const loggedDb = drizzle(loggedSqlite, {
    //         schema: dictionarySchema,
    //         logger: {
    //             logQuery(query, params) {
    //                 loggedQueries.push({ sql: query, params: params ?? [] });
    //             },
    //         },
    //     });

    //     createSchema(loggedSqlite, loggedDb);
    //     mockedGetDicDb.mockReturnValue(loggedDb);

    //     await importWords(sliceWordsJSLPath);
    //     await importWordPoses(slicePosesJSLPath);
    //     await importDefinitions(sliceDefsPath);
    //     await importExamples(sliceExpsJSLPath);
    //     loggedQueries.length = 0;

    //     const loggerService = new DatabaseService();
    //     const result = await loggerService.queryWord('run');
    //     expect(result).not.toBeNull();
    //     expect(loggedQueries.length).toBeGreaterThan(0);

    //     for (const { sql, params } of loggedQueries) {
    //         const explainSql = `EXPLAIN QUERY PLAN ${sql}`;
    //         const planRows = loggedSqlite.prepare(explainSql).all(...params) as ExplainPlanRow[];
    //         const printableParams = params.map((param) =>
    //             Buffer.isBuffer(param) ? `0x${param.toString('hex')}` : param,
    //         );

    //         console.info('\n[QUERY]');
    //         console.info(sql);
    //         console.info(`[PARAMS] ${JSON.stringify(printableParams)}`);
    //         console.info(`[PLAN] ${JSON.stringify(planRows, null, 2)}`);

    //         expect(planRows.length).toBeGreaterThan(0);
    //     }

    //     loggedSqlite.close();
    // });
});
