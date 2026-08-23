import fs from "node:fs";
import Database from "better-sqlite3";
import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { dictionarySchema } from "@main/db/db.js";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

export function createSchema(sqlite: Database.Database, db: BetterSQLite3Database<typeof dictionarySchema>): void {
    sqlite.pragma("foreign_keys = ON");
    migrate(db, {
        migrationsFolder: path.resolve(dirname(fileURLToPath(import.meta.url)), "../../migrations/dictionary"),
    });
}

export function writeJsonLinesFile(tempDir: string, filename: string, rows: unknown[]): string {
    const filePath = path.join(tempDir, filename);
    const content = `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`;
    fs.writeFileSync(filePath, content, "utf8");
    return filePath;
}
