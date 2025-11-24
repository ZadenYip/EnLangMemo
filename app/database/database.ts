import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import log from 'electron-log/main';

let db: Database.Database | null = null;

export function initDatabase(): void {
    if (db === null) {
        const dbDirPath = path.join(
            path.dirname(app.getPath('exe')),
            'user_data'
        );
        if (!fs.existsSync(dbDirPath)) {
            fs.mkdirSync(dbDirPath);
        }
        // 判断数据库db文件是否存在
        db = new Database(path.join(dbDirPath, 'app_database.db'));
        db.pragma('journal_mode = WAL');
        log.info(
            'Database initialized at', path.join(dbDirPath, 'app_database.db')
        );
    } else {
        log.warn('Database already initialized');
    }
    createTableIfNotExists();
}

export function closeDatabase(): void {
    if (db !== null) {
        db.close();
        log.info('Database connection closed.');
    }
}

export function runSQL(
    sql: string,
    params: any[] = []
): Database.RunResult | any[] {
    if (db === null) {
        throw new Error('Database not initialized.');
    }

    try {
        const stmt = db.prepare(sql);
        // 判断语句是否会返回结果集还是单纯的执行
        if (stmt.reader) {
            return stmt.all(...params);
        } else {
            return stmt.run(...params);
        }
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

export const createDeckSQL = `
    CREATE TABLE IF NOT EXISTS decks (
    deck_id INTEGER PRIMARY KEY, -- Unix 时间
    name TEXT NOT NULL,
    new_cards_per_day INTEGER DEFAULT 20, -- 允许每天新学的卡片数量
    new_cards_learned INTEGER DEFAULT 0, -- 已学习的新卡片数量
    algorithm_parameters TEXT -- 算法参数的 JSON 字符串
    );
`;
function createTableIfNotExists(): void {
    runSQL(createDeckSQL);
}
