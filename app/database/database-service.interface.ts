import type Database from "better-sqlite3";
import { ProxyPropertyType } from "electron-ipc-cat/common";

export interface IDatabaseService {
    runSQL(sql: string, params?: any[]): Promise<any[] | Database.RunResult>;
}

export const DatabaseServiceIPCDescriptor = {
    channel: 'database',
    properties: {
        runSQL: ProxyPropertyType.Function
    },
};
