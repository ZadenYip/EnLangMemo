interface Window {
    bridge: {
        database: {
            ipcRunSQL: (sql: string, params?: any[]) => Promise<any>;
        }
    }
}
