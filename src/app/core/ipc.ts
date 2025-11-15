

export function ipcRunSQL(sql: string, params: any[] = []): Promise<any[]> {
    return (window as any).bridge.database.ipcRunSQL(sql, params);
}