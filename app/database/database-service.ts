import Database from "better-sqlite3";
import { runSQL } from "./database";
import { IDatabaseService } from "./database-service.interface";

export class DatabaseService implements IDatabaseService {
    
    public async runSQL(sql: string, params: any[] = []): Promise<any[] | Database.RunResult> {
        return runSQL(sql, params);
    }
}
