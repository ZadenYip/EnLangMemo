import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

export function createSchema(sqlite: Database.Database, db: BetterSQLite3Database): void {
    sqlite.pragma('foreign_keys = ON');
    migrate(db, {
        migrationsFolder: path.resolve(__dirname, '../../migrations'),
    });
}

export function writeJsonLinesFile(tempDir: string, filename: string, rows: unknown[]): string {
    const filePath = path.join(tempDir, filename);
    const content = `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`;
    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
}

export function writeRawLinesFile(tempDir: string, filename: string, lines: string[]): string {
    const filePath = path.join(tempDir, filename);
    const content = `${lines.join('\n')}\n`;
    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
}
