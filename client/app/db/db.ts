import Database from "better-sqlite3";
import { app } from "electron";
import * as path from "path";
import * as fs from "fs";
import Logger from "electron-log";
import { BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import * as dic_schema from "./schema/dictionary/dic";
import * as rep_schema from "./schema/repetition/rep";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { AppConfig } from "./config/config";

export const dictionarySchema = dic_schema;
export const repetitionSchema = rep_schema;
let dicDb: BetterSQLite3Database<typeof dic_schema>;
let repDb: BetterSQLite3Database<typeof rep_schema>;

let sqlDic: Database.Database;
let sqlRep: Database.Database;

export function initDatabase(appConfig: AppConfig): void {
    
    const selectedAccount = appConfig.selectedAccount;
    Logger.info("Selected account:", selectedAccount);

    // executable's directory/user_data
    const dbDir = path.join(path.dirname(app.getPath("exe")), "user_data", selectedAccount);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir);
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
}

export function getDicDb(): BetterSQLite3Database<typeof dic_schema> {
    return dicDb;
}

export function getRepDb(): BetterSQLite3Database<typeof rep_schema> {
    return repDb;
}

