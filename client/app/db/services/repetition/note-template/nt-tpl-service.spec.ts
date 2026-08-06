import Database from "better-sqlite3";
import path from "node:path";
import { BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { getRepDb, repetitionSchema } from "@main/db/db";
import { generateUUIDV7, hexToBuffer } from "@main/db/import/utils";
import { noteTypesTable } from "@main/db/schema/repetition/rep";
import { NoteTplService } from "./nt-tpl-service";
import {
    createSentenceMiningDefinitionNoteTpl as sentenceMiningDefinitionNoteTpl,
    SENTENCE_MINING_DEFINITION_TPL_NAME,
} from "./nt-tpl-service-helper";

vi.mock(import("@main/db/db"), async () => {
    const actual = await vi.importActual<typeof import("@main/db/db")>("@main/db/db");
    return {
        ...actual,
        getRepDb: vi.fn(),
    };
});

interface ExplainPlanRow {
    id: number;
    parent: number;
    notused: number;
    detail: string;
}

interface SqliteMasterRow {
    sql: string | null;
}

interface IndexListRow {
    seq: number;
    name: string;
    unique: number;
    origin: string;
    partial: number;
}

interface IndexInfoRow {
    seqno: number;
    cid: number;
    name: string;
}

interface IndexXInfoRow {
    seqno: number;
    cid: number;
    name: string | null;
    desc: number;
    coll: string;
    key: number;
}

/**
 * Enable or disable debug output for EXPLAIN QUERY PLAN.
 */
const DEBUG_EXPLAIN = false;

describe("NoteTplService", () => {
    const mockedGetRepDb = vi.mocked(getRepDb);

    let sqlite!: Database.Database;
    let db: BetterSQLite3Database<typeof repetitionSchema>;
    let service: NoteTplService;

    beforeEach(() => {
        sqlite = new Database(":memory:");
        sqlite.pragma("foreign_keys = ON");
        db = drizzle(sqlite, { schema: repetitionSchema });
        migrate(db, {
            migrationsFolder: path.resolve(__dirname, "../../../migrations/repetition"),
        });
        mockedGetRepDb.mockReturnValue(db);
        service = new NoteTplService();
    });

    afterEach(() => {
        mockedGetRepDb.mockReset();
        if (sqlite) {
            sqlite.close();
        }
    });

    it("should query note template by blob primary key id", async () => {
        await db.insert(noteTypesTable).values({
            id: generateUUIDV7(),
            name: SENTENCE_MINING_DEFINITION_TPL_NAME,
            usn: -1,
            updatedAt: Date.now(),
            noteTemplate: sentenceMiningDefinitionNoteTpl(),
        });

        const refs = await service.getAllNoteTplRefs();
        expect(refs.length).toBe(1);

        const targetRef = refs[0];
        const noteTpl = await service.getNoteTplById(targetRef.id);
        expect(noteTpl).not.toBeNull();
        expect(noteTpl?.front).toContain("{{Context}}");
        expect(noteTpl?.back).toContain("{{Target Definition}}");
        expect(noteTpl?.back).toContain("{{Source Definition}}");
    });

    it("should use primary-key index search for blob id lookup", async () => {
        await db.insert(noteTypesTable).values({
            id: generateUUIDV7(),
            name: "ExplainPkSearch",
            usn: -1,
            updatedAt: Date.now(),
            noteTemplate: sentenceMiningDefinitionNoteTpl(),
        });
        const refs = await service.getAllNoteTplRefs();
        const targetRef = refs[0];

        const sql = "SELECT note_template FROM note_types WHERE id = ?";
        const params = [hexToBuffer(targetRef.id)];
        const rows = sqlite.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...params) as ExplainPlanRow[];
        if (DEBUG_EXPLAIN) {
            console.info("\n[EXPLAIN QUERY PLAN]");
            console.info(`SQL: ${sql}`);
            console.info(rows.map((row) => row.detail).join("\n"));
            const tableSql = sqlite
                .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'note_types'")
                .get() as SqliteMasterRow | undefined;
            console.info("\n[SQLITE MASTER]");
            console.info(tableSql?.sql ?? "<no table sql found>");
            const indexRows = sqlite
                .pragma("index_list('note_types')", { simple: false }) as IndexListRow[];
            console.info("\n[PRAGMA index_list('note_types')]");
            console.info(JSON.stringify(indexRows, null, 2));
            for (const indexRow of indexRows) {
                const indexInfoRows = sqlite
                    .pragma(`index_info('${indexRow.name}')`, { simple: false }) as IndexInfoRow[];
                console.info(`\n[PRAGMA index_info('${indexRow.name}')]`);
                console.info(JSON.stringify(indexInfoRows, null, 2));
                const indexXInfoRows = sqlite
                    .pragma(`index_xinfo('${indexRow.name}')`, { simple: false }) as IndexXInfoRow[];
                console.info(`\n[PRAGMA index_xinfo('${indexRow.name}')]`);
                console.info(JSON.stringify(indexXInfoRows, null, 2));
            }
        }

        expect(rows.length).toBeGreaterThan(0);
        const details = rows.map((row) => row.detail.toUpperCase());
        const hasIndexedSearch = details.some((detail) =>
            detail.includes("SEARCH") && (detail.includes("INDEX") || detail.includes("PRIMARY KEY")),
        );
        const hasFullScan = details.some((detail) => detail.includes("SCAN") && detail.includes("NOTE_TYPES"));

        expect(hasIndexedSearch).toBe(true);
        expect(hasFullScan).toBe(false);
    });
});
