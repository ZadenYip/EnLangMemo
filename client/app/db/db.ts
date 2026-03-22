import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import Logger from 'electron-log';
import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema/dictionary';

export const dictionarySchema = schema;

let dicDb: BetterSQLite3Database<typeof schema>;
let cardDb: BetterSQLite3Database;
let sqliteDic: Database.Database;
let sqliteCard: Database.Database;

export function initDatabase() {

    // Ensure the database directory exists
    const dbDirPath = path.join(path.dirname(app.getPath('exe')), 'user_data');
    if (!fs.existsSync(dbDirPath)) {
        fs.mkdirSync(dbDirPath);
    }

    // Initialize the dictionary database
    const dicDbPath = path.join(dbDirPath, 'dictionary.db');
    Logger.info('Database initialization at', dicDbPath);
    sqliteDic = new Database(dicDbPath);
    sqliteDic.pragma('journal_mode = WAL');
    dicDb = drizzle(sqliteDic, { schema: schema });

    // Initialize the card database
    const cardDbPath = path.join(dbDirPath, 'cards.db');
    Logger.info('Database initialization at', cardDbPath);
    sqliteCard = new Database(cardDbPath);
    sqliteCard.pragma('journal_mode = WAL');
    cardDb = drizzle(sqliteCard);
}

export function getDicDb(): BetterSQLite3Database<typeof schema> {
    return dicDb;
}

export function getCardDb(): BetterSQLite3Database {
    return cardDb;
}

export function runSQL(
    sql: string,
    params: any[] = [],
): any[] | Database.RunResult {
    const stmt = sqliteCard.prepare(sql);
    const command = sql.trim().toLowerCase();

    if (
        command.startsWith('select') ||
        command.startsWith('pragma') ||
        command.startsWith('with') ||
        command.startsWith('explain')
    ) {
        return stmt.all(...params);
    }

    return stmt.run(...params);
}
