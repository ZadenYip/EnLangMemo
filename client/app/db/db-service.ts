import Database from 'better-sqlite3';
import { getDicDb, runSQL } from './db';
import { IDatabaseService } from './db-service.interface';
import { wordsTable } from './schema/dictionary';
import { eq } from 'drizzle-orm';

export class DatabaseService implements IDatabaseService {
    public async runSQL(
        sql: string,
        params: any[] = [],
    ): Promise<any[] | Database.RunResult> {
        return runSQL(sql, params);
    }

    public async queryWord(spelling: string): Promise<any[]> {
        const result = await getDicDb()
            .select({
                wordId: wordsTable.wordId,
                phoneticBre: wordsTable.phoneticBre,
                phoneticAme: wordsTable.phoneticAme,
            })
            .from(wordsTable)
            .where(eq(wordsTable.spelling, spelling));

        const { wordId, phoneticBre, phoneticAme } = result[0];
        // TODO
        return result;
    }
}
