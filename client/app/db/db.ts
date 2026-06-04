import Database from "better-sqlite3";
import * as path from "path";
import * as fs from "fs";
import Logger from "electron-log/main";
import { BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import * as dic_schema from "./schema/dictionary/dic";
import * as rep_schema from "./schema/repetition/rep";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { AppConfig } from "./config/config";
import { getAccountDir } from "@main/paths";
import { ColConfig } from "./services/repetition/collection/col-service-types";
import { noteTypesTable } from "./schema/repetition/rep";
import { generateUUIDV7 } from "./import/utils";
import { genNoteTpl } from "./services/repetition/note-template/nt-tpl-service-helper";

export const dictionarySchema = dic_schema;
export const repetitionSchema = rep_schema;
let dicDb: BetterSQLite3Database<typeof dic_schema>;
let repDb: BetterSQLite3Database<typeof rep_schema>;

let sqlDic: Database.Database;
let sqlRep: Database.Database;

export function initDatabase(appConfig: AppConfig): void {
    const selectedAccount = appConfig.selectedAccount;
    Logger.info("Selected account:", selectedAccount);

    const dbDir = getAccountDir(selectedAccount);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    // Initialize the dictionary database
    const dicDbPath = path.join(dbDir, "dictionary.db");
    Logger.info("Database initialization at", dicDbPath);
    sqlDic = new Database(dicDbPath);
    sqlDic.pragma("journal_mode = WAL");
    dicDb = drizzle(sqlDic, { schema: dic_schema });

    // TODO 生产环境改为对应路径，现在为开发方便还没改
    // __dirname is main.js's directory
    migrate(dicDb, { migrationsFolder: path.join(__dirname, "db", "migrations", "dictionary") });

    // Initialize the card database
    const repDbPath = path.join(dbDir, "repetition.db");
    Logger.info("Database initialization at", repDbPath);
    sqlRep = new Database(repDbPath);
    sqlRep.pragma("journal_mode = WAL");
    repDb = drizzle(sqlRep, { schema: rep_schema });
    migrate(repDb, { migrationsFolder: path.join(__dirname, "db", "migrations", "repetition") });
    collectionInit();
}

function collectionInit(): void {
    // if exist collection record, do nothing
    const existing = repDb.select().from(rep_schema.collectionTable).all();
    if (existing.length > 0) {
        Logger.info("Collection record already exists, skipping initialization.");
        return;
    }

    Logger.info("No collection record found, initializing collection table with default config.");
    const version = 1;
    const zeroTime = (new Date(0)).getTime();
    const usn = -1;
    const date = new Date();
    const nowTime = date.getTime();

    // IANA time zone string, e.g. "Asia/Shanghai"
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const collectionConfig = {
        timeZone,
        dailyResetTime: 4,
        lastRolloverAt: zeroTime,
    } as ColConfig;

    repDb.insert(rep_schema.collectionTable).values(
        {
            sqliteSchemaVersion: version,
            lastSyncTime: zeroTime,
            lastSyncUsn: usn,
            usn: usn,
            createdAt: nowTime,
            updatedAt: nowTime,
            collectionSchemaUpdatedAt: nowTime,
            config: collectionConfig
        }
    ).run();

    repDb.insert(noteTypesTable).values({
                id: generateUUIDV7(),
                name: "Default Note Template",
                usn: -1,
                updatedAt: Date.now(),
                noteTemplate: genNoteTpl(),
    }).run();
    Logger.info("Database tables initialized with default values.");
}

export function reInitDatabase(appConfig: AppConfig): void {
    if (sqlDic) {
        sqlDic.close();
    }
    if (sqlRep) {
        sqlRep.close();
    }
    Logger.info("Reinitializing database with new config");
    initDatabase(appConfig);
}

export function getDicDb(): BetterSQLite3Database<typeof dic_schema> {
    return dicDb;
}

export function getRepDb(): BetterSQLite3Database<typeof rep_schema> {
    return repDb;
}

